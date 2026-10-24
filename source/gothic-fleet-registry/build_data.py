# -*- coding: utf-8 -*-
"""Kokoaa bfg_data.json: alusprofiilit + laivastolistat + koneellisesti
tarkistettavat listasaannot.

Saannot sidotaan listan OMIIN osioihin ('Battleships', 'Cruisers', 'KROOZERS'),
ei alusten TYPE-kenttaan: kirjassa esim. 'heavy cruiser' on statseiltaan
'Cruiser', joten tyyppikentan varassa laskeminen antaisi vaaria tuloksia.

Ajojarjestys:  extract.py -> lists.py -> build_data.py
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy

P = json.load(io.open("profiles_raw.json", encoding="utf-8"))
L = json.load(io.open("lists_raw.json", encoding="utf-8"))

# Kirjan kirjoitusvirheet aluksen faktiokentassa. Kentta tulostuu kortin
# alaotsikkoon sellaisenaan, joten kirjoitusasu korjataan.
SHIP_FL_FIX = {"INQUISTION": "INQUISITION"}
_FL_FIXED = [0]

FIXES = {
    # Listarivi sivulla 372 on korruptoitunut: "(pg. 377)). 2310 pts".
    # Seka hinta etta sivuviite ovat siina vaarin. Oikeat luvut ovat
    # profiilisivulta 381 ("ZUKOV'S KLAW ASSAULT KROOZER  210 PTS") ja
    # sivun 534 pistehakemistosta ("Zukov's Klaw Assault Kroozer 210").
    # ref on annettava tassa. Muuten sivuviitteiden ristiintarkistus
    # korjaa viitteen itse ja kirjoittaa oman huomautuksensa taman
    # paalle, jolloin hinnan korjaus jaisi kertomatta.
    ("Orks — Da Ork Clanz", "Zukov's Klaw (Goff only)"):
        dict(pts=210, ref=381,
             note="Source misprint: the list row on pg. 372 reads "
                  "'(pg. 377)). 2310 pts'. Both numbers are wrong: the "
                  "profile on pg. 381 and the points index on pg. 534 "
                  "give 210 pts."),
    # Nama rivit ovat kirjan sivulla 145, joka on Grey Knights -listaa.
    # Avain oli aiemmin "The Emperor's Inquisition", koska Grey Knights
    # oli sulautettu siihen; listojen erottamisen jalkeen 7.9.2026 avain
    # on Grey Knights. Ilman muutosta korjaus lakkasi osumasta ja
    # sivuviitteet palasivat kirjan virheellisiksi.
    ("Grey Knights", "Rapid strike vessel (Sword)"):
        dict(ref=82, note="Source misprint: pg. 80 is the Falchion; Sword is pg. 82."),
    ("Grey Knights", "Rapid strike vessel (Cobra)"):
        dict(ref=84, note="Source misprint: pg. 82 is the Sword; Cobra is pg. 84."),
    # Kirjan sivulla 176 rivi on "Havoc Class Frigatevvvv....35 pts":
    # sivuviite on korruptoitunut nimen perään. Sama alus on sivuilla
    # 174 ja 179 muodossa "Havoc Class Frigate (pg. 81)".
    ("Rogue Traders — Exploration", "Havoc Class Frigatevvvv"):
        dict(ref=81, label="Havoc Class Frigate",
             note="Source misprint: the page reference on pg. 176 is garbled "
                  "into the name ('Frigatevvvv'). The ship is on pg. 81."),
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host"):
        dict(ref=None, upgrade=True,
             note="Fleet upgrade from pg. 305, not a ship profile."),
}

# Kirjan lukusanat. Yli kymmenen tarvitaan Demiurgin katolle "no more
# than twelve cruisers" (s.487); se on kirjan ainoa yli kymmenen menevä
# lukusana saantolauseessa.
# Vertailumuoto: vain kirjaimet ja numerot. Kaytetaan sekä lauseen
# omistajan tunnistamiseen että toistuvan huomautuksen karsintaan.
def _nkey(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


# Aluksen omien optioiden vaikutukset. Avain on (profiilisivu, tunniste
# option tekstista); arvo yhdistetaan option dictiin.
#
#   mod  statsimuutos: hp, tu (tornit), sh (kilvet)
#   swp  aserivin muutos: f = nimen kaava, rg = kantama, st = voimakkuus
#        ("+2" ja "-2" ovat muutoksia, muu on absoluuttinen arvo)
#   qty  toistettava valinta: enintaan max kertaa
#
# Nama on luettu kirjasta yksitellen. Ilman niita maksettu optio muutti
# vain hintaa eika koskaan korttia.
OPT_EFFECTS = {
    # s.68: "Originally fitted with 45cm range weapons batteries
    # (Firepower 6), these were later upgraded to shorter ranged but more
    # powerful weapons as shown."  Vanhempi versio on siis 45 cm / FP 6.
    (68, "Originally fitted with 45cm range"):
        dict(swp=dict(f=r"weapons battery", rg="45 cm", st="6")),
    # s.374: "May upgrade its turrets from two to three for +10 pts."
    (374, "upgrade its turrets from two to three"):
        dict(mod=dict(tu=1)),
    # --- Pistokoe 6 (laaja tarkastus) -------------------------------------
    # s.255 Chaos battle barge: "Can embark Chaos Space Marines for +35
    # points" ja "may embark Chosen Terminators for +10 points" ovat samat
    # ostot kuin jumallistojen rivit "<Legion> Chaos Space Marine crew" ja
    # "Chosen Terminators (battleship / grand cruiser)" (s.234-249). cov =
    # rivin nimen kuvio, jonka optio kattaa (domain.js optionCoversRow);
    # optiolla ostettu miehisto avaa myos Markin (s.244 "A ship with a
    # World Eaters Chaos Space Marine crew may have a Mark of Khorne").
    (255, "Can embark Chaos Space Marines"):
        dict(cov=r"chaos space marine crew$"),
    (255, "may embark Chosen Terminators"):
        dict(cov=r"^chosen terminators"),
    # Optio jolle kirja ei kirjoita hintaa on ilmainen, ei "see text":
    # s.105 Strike cruiser "May replace its launch bays for strength-6,
    # speed: 30 cm torpedo tubes", s.151 Grey Knights strike cruiser "May
    # replace launch bays for a firepower-5 ... bombardment cannon battery"
    # (Codexin vastaava s.105 sanoo "for no change in cost"); s.84 Cobran
    # tutkarefitin hinta on sen omassa merkinnassa alempana.
    (105, "strength-6, speed: 30 cm torpedo tubes"):
        dict(c=0),
    # s.69 Tyrant "Can replace its prow torpedoes with a nova cannon at a cost
    # of +20 pts" on sama osto kuin Mechanicus-listan s.121 rivi "Nova Cannon
    # instead of prow torpedoes" (+20) - cov kattaa rivin (pistokoe 7 rivi 85).
    (69, "replace its prow torpedoes with a nova cannon"):
        dict(cov=r"^nova cannon instead of prow torpedoes$"),
    # s.53 Emperor "For an extra +5 points an Emperor class ship may carry
    # squadrons of Shark assault boats" on sama osto kuin Bakka-listan s.49
    # "An Emperor class battleship may carry Shark assault boats at an
    # additional cost of +5 points" - cov kattaa rivin (pistokoe 15 rivi 13).
    (53, "carry squadrons of Shark assault boats"):
        dict(cov=r"^shark assault boats"),
    (151, "firepower-5, range 30 cm (front arc only) bombardment cannon battery"):
        dict(c=0),
    # --- P1-2: lisaavat statsivaikutukset (referenssi/optiot.json) --------
    # s.61: "May purchase a third turret for an additional +10 points."
    (61, "third turret"):
        dict(mod=dict(tu=1)),
    # s.66: "Can have its turret array upgraded from 2 to 3 at an
    # additional cost of +10 pts"
    (66, "turret array upgraded from 2 to 3"):
        dict(mod=dict(tu=1)),
    # s.105: "May take an additional shield for +15 points."
    (105, "additional shield"):
        dict(mod=dict(sh=1)),
    # s.269: "May have a third shield for +15 pts, when modelled on a
    # large 60 mm base."
    (269, "third shield"):
        dict(mod=dict(sh=1)),
    # --- Rynnakkotorpedot EIVAT ole aserivi (J190, kayttaja 12.10.2026) ----
    # "boarding torb ostos vain sinne optio riviin, ei aseisiin kun ostetaan
    # jo olemassa oleviin torbedoihin. koska niihin ostetaan vain uuden
    # tyyppinen ammus". Rulebook s.78: "Boarding torpedoes are launched like
    # ordinary torpedoes". Optio (s.374, 377, 380, 382, 383, 389) ei siis tuo
    # profiiliin rivia: ammuksen nopeus ja vahvuus lukevat option omassa
    # tekstissa, ja Boarding Torpedoes -saantorivi syntyy option tekstista.
    # Aiemmin naille oli add=["Boarding torpedoes", "20 cm", ...] (P1-3);
    # kuittaukset ovat referenssi/optiot.json:ssa (effect null).
    # Hulkin optio on sama osto kuin Clanz-listan "Boarding torpedoes (Space
    # Hulk)" +15 (s.372) - cov kattaa rivin (pistokoe 7 rivi 22).
    (389, "equipped with boarding torpedoes"):
        dict(cov=r"^boarding torpedoes"),
    # --- kohta 7, era 2: patterirefitit (referenssi/optiot.json) ----------
    # s.59: "Reduce the range of the weapons batteries to 30 cm and increase
    # their firepower to 10, at no extra points"
    (59, "shorter range but more powerful weapons batteries"):
        dict(swp=dict(f=r"weapons battery", rg="30 cm", st="10")),
    # s.64: "Its 45 cm weapons batteries increase their range to 60 cm for
    # +10 points" - vain 45 cm:n patterit, 60 cm:n patterit pysyvat
    (64, "improved weapons batteries"):
        dict(swp=dict(f=r"weapons battery", onlyrg="45 cm", rg="60 cm")),
    # s.269: "increases the range of its dorsal lances to 45 cm at an
    # additional cost of +10 pts"
    (269, "ancient targeting systems"):
        dict(swp=dict(f=r"dorsal lance", rg="45 cm")),
    # --- kohta 7, era 3: keulapanssari 6+ (referenssi/optiot.json) --------
    # s.72 (sama teksti s.73-76, 181): "May increase the prow armour to 6+
    # for no additional cost. However, if this option is taken, the turning
    # radius of these vessels is reduced to 45 degrees." Perus 5+ / 90°.
    # set asettaa tekstistatsin; mod lisaa lukuun. Sama alus painetaan
    # useammalle sivulle eri listoja varten, ja jokainen sivu on oma avain.
    (72, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (73, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (74, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (75, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (76, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (181, "prow armour to 6+"): dict(set=dict(ar="6+ front / 5+", tn="45°")),
    # --- kohta 7, era 4 (referenssi/optiot.json) --------------------------
    # s.472/473 Emissary: "a deflector that raises its prow armour to 6+ for
    # +10 points" - kolme sivuavainta samalle alukselle (konfiguraatiot)
    ("472",  "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    ("472b", "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    ("472c", "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    # s.359: "Torpedo-bommas only move 20 cm ... an additional ordnance choice
    # available to the carrier and do not replace fighta-bommas." Kaikki
    # aluksen launch bayt saavat uuden ordnance-tyypin kantamasoluun.
    (374, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (376, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (377, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (378, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (379, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    # --- kohta 7, era 6 (referenssi/optiot.json) --------------------------
    # s.480/481 "Ion Cannon Turret": EI add-rivia - optio omistaa jo
    # perusrivin aws:lla (480_defence-ryhma, gmax 1: yksi puolustus-
    # jarjestelma per security-moduuli). add olisi tuplannut tornin.
    # s.126: "an Ark Mechanicus may exchange its broadside lance batteries
    # for strength-2 launch bays for +10 points." Rivit 2-3 (port/starboard
    # lance battery) korvautuvat; attack craft Fury/Starhawk (s.125).
    # sw on sama rakenne kuin swaps.py:n tuottama: f = rivi-indeksit,
    # t = korvaavat rivit samassa jarjestyksessa.
    (126, "represents only one of several unique Arks"):
        dict(sw=dict(f=[2, 3], t=[["Port launch bays", "Furies: 30 cm / Starhawks: 20 cm", "2", "–"],
                                 ["Starboard launch bays", "Furies: 30 cm / Starhawks: 20 cm", "2", "–"]])),
    # --- kohta 7, era 7 (referenssi/optiot.json) --------------------------
    # s.279 Murder: "replace its Firepower 10 weapons batteries with Firepower
    # 4 weapons batteries and Strength 2 lance batteries (all 45 cm range,
    # with port and starboard arcs each) for no extra points". Patterit
    # pienenevat (swp) ja kaksi lanssiriivia tulee lisaa (add-lista).
    (279, "Firepower 10 weapons batteries with Firepower 4"):
        dict(swp=dict(f=r"weapons battery", st="4"),
             add=[["Port lance battery", "45 cm", "2", "Left"],
                  ["Starboard lance battery", "45 cm", "2", "Right"]]),
    # s.84 Cobra: tutkarefit "removes the squadron's weapons batteries".
    # Kirja ei kirjoita hintaa: ilmainen, ei "see text" (pistokoe 6 rivit
    # 64, 73).
    (84, "experimental long range detection gear"):
        dict(c=0, **{"del": r"weapons battery"}),
    # s.192 Armed Cargo Vessel: "converted to a fast clipper by entirely
    # removing its primary battery armament for the Advanced Drive Technology
    # refit" - s.175: "+5 cm to its speed as well as +1D6 when undergoing All
    # Ahead Full". 25 cm -> 30 cm, patteri pois, "for no extra cost" -> 0.
    (192, "Fast Clipper"):
        dict(**{"del": r"weapons battery"}, set=dict(sp="30 cm"), c=0),
    # s.182 Heavy Transport: "Super-Heavy Transport (+50 pts): ... add +4HP to
    # their profile". Pistokoe 5 (10.9.2026), rivi 52.
    (182, "Super-Heavy Transport"):
        dict(mod=dict(hp=4)),
    # s.462 Merchant (molemmat kokoonpanot): "increase their hits from 4 to 6
    # at a cost of +15 points". Pistokoe 5, rivi 84.
    ("462",  "increase their hits from 4 to 6"): dict(mod=dict(hp=2)),
    ("462b", "increase their hits from 4 to 6"): dict(mod=dict(hp=2)),
    # s.494: Warspheren runko ja patteri kasvavat tai pienenevat pareittain.
    (494, "may add 2HP and 2 firepower"):
        dict(mod=dict(hp=2), swp=dict(f=r"weapons battery", st="+2"),
             qty=dict(max=3)),
    (494, "may subtract 2HP and 2 firepower"):
        dict(mod=dict(hp=-2), swp=dict(f=r"weapons battery", st="-2"),
             qty=dict(max=2)),
    (494, "add +1 shield"):
        dict(mod=dict(sh=1)),
    (494, "+1 turret strength"):
        dict(mod=dict(tu=1)),
    (494, "extend the range of its weapons battery by +15 cm"):
        dict(swp=dict(f=r"weapons battery", rg="45 cm")),
}
_OPT_EFFECT_HITS = {}

NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
       "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11,
       "twelve": 12, "a": 1, "an": 1}


def n(w):
    w = (w or "").strip().lower().replace(",", "")
    if w in NUM:
        return NUM[w]
    return int(w) if w.isdigit() else None


ABBR = [(r"\bmax\.", "max"), (r"\bpg\.", "pg"), (r"\bapprox\.", "approx"),
        (r"\bi\.e\.", "ie"), (r"\be\.g\.", "eg"), (r"\bNo\.", "No"),
        (r"\bMk\.", "Mk"), (r"\bSt\.", "St")]


def sentences(t):
    """Lauserajaus. Lyhenteet siivotaan ensin: 'a max. of one Warlord per 500
    points' katkesi muuten kesken, jolloin saanto jai tunnistamatta."""
    for pat, rep in ABBR:
        t = re.sub(pat, rep, t)
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", t) if x.strip()]


def sing(w):
    w = w.strip().lower()
    w = re.sub(r"[^a-z’' ]", "", w).strip()
    for suf in ("zes", "ies", "s"):
        if w.endswith(suf) and len(w) > 4:
            return w[:-len(suf)] + ("y" if suf == "ies" else ("z" if suf == "zes" else ""))
    return w


# ------------------------------------------------------------------ ALUKSET
def ship_type(p):
    return (p["stats"].get("TYPE/HITS", "") or "").split("/")[0].strip() or "Ship"


def hits(p):
    m = re.search(r"/(\d+)", p["stats"].get("TYPE/HITS", ""))
    return int(m.group(1)) if m else None


PTS_COST = [
    (re.compile(r"at\s+no\s+(?:extra|additional)\s+points?\s+cost", re.I), 0),
    (re.compile(r"free\s+of\s+(?:points\s+)?cost", re.I), 0),
]
# Merkki luetaan mukaan: nelja kirjan optiota on negatiivisia, eli alus
# on halvempi vaihdon jalkeen (Mercury -20, Victory -10, Dominator -5,
# Warsphere -20). Ilman merkkia ne jaivat kokonaan hinnoittelematta.
PTS_NUM = re.compile(r"(?:\+|for\s+|cost\s+of\s+|at\s+|:\s*)(?P<sg>[-\u2013\u2212+]?)\s*(\d+)\s*(?:pts|points)", re.I)
PER_BAY = re.compile(r"per\s+launch\s+bay|per\s+turret|each|per\s+\w+\s+of", re.I)


def parse_options(text):
    """OPTIONS-lohko -> [{t: teksti, c: hinta tai None, var: 1 jos hinta vaihtelee}]."""
    if not text:
        return []
    parts = [x.strip(" •	") for x in re.split(r"\s*•\s*", text) if x.strip(" •	")]
    out = []
    for i, t in enumerate(parts):
        cost, var = None, 0
        for pat, v in PTS_COST:
            if pat.search(t):
                cost = v
                break
        if cost is None:
            m = PTS_NUM.search(t)
            if m:
                cost = int(m.group(2))
                if m.group("sg") in ("-", "\u2013", "\u2212"):
                    cost = -cost
                if PER_BAY.search(t):
                    var = 1
        o = dict(t=t, c=cost, var=var)
        # "If fitted with a torpedo launcha, it may carry boarding torpedoes"
        if re.match(r"^If\b", t, re.I):
            for j in range(i):
                key = re.search(r"^If\s+(?:it\s+is\s+)?(?:fitted\s+with\s+)?(?:a\s+|an\s+|the\s+)?([\w\- ]{4,26})", t, re.I)
                if key and key.group(1).strip().lower()[:14] in parts[j].lower():
                    o["dep"] = j
                    break
        out.append(o)
    return out


_TURNS_FIXED = [0]


def turns_text(t):
    """s.181 Endeavour painaa TURNS-arvon '90' ilman astemerkkia; kortti
    tulosti sen sellaisenaan (pistokoe 6). Pelkka luku on asteita.
    Puolustusrakennelmien '0' (s.506-517) jaa: se ei ole kulma vaan
    'ei kaanny', ja kirja painaa sen ilman merkkia."""
    t = str(t or "").strip()
    if re.fullmatch(r"[1-9]\d*", t):
        _TURNS_FIXED[0] += 1
        return t + "°"
    return t


ships = {}
for p in P:
    ships[str(p["page"])] = dict(
        pg=p["page"], fl=p["fleet"], nm=p["title"], bp=p["pts"],
        ty=ship_type(p), hp=hits(p),
        sp=p["stats"].get("SPEED", ""), tn=turns_text(p["stats"].get("TURNS", "")),
        sh=p["stats"].get("SHIELDS", ""), ar=p["stats"].get("ARMOUR", ""),
        tu=p["stats"].get("TURRETS", ""), tl=p.get("defense_label", "TURRETS"),
        qd=1 if p.get("quadrant") else 0,
        aw=[[a.get("armament", ""), a.get("range", ""), a.get("fp", ""), a.get("arc", "")]
            for a in p["arms"]],
        op=p["extras"].get("OPTIONS", ""),
        ol=parse_options(p["extras"].get("OPTIONS", "")),
        # Kirjassa otsikko on joko SPECIAL, NOTES tai NOTE (yksikko). Aiemmin
        # luettiin vain kaksi ensimmaista, jolloin NOTE-lohko jai kortilta pois.
        sr=" ".join(x for x in (p["extras"].get(k, "").strip()
                                for k in ("SPECIAL", "NOTES", "NOTE", "UPGRADES", "REFITS"))
                    if x),
    )

# Kirjan kaksi [???]-ristiviitetta osoittavat Rogue Traderin Xenotech Systems
# -taulukkoon sivulle 175. Kortille tulostetaan korjattu viite.
if "184" in ships:
    ships["184"]["sr"] = ships["184"]["sr"].replace("[???]", "p. 175")
if "192" in ships:
    ships["192"]["op"] = ships["192"]["op"].replace("[???]", "p. 175")
    ships["192"]["ol"] = parse_options(ships["192"]["op"])

# Sivulla 481 (Tau Waystation) SPECIAL-laatikko ja taulukon Ion cannon -rivi
# menevat paallekkain, ja tekstinpoiminta yhdisti aserivin ensimmaisen
# lauseen sisaan: "even if Ion cannon 30 cm 1 All round planetary defences
# are not normally permitted". Kirjan lause on "even if planetary defences
# are not normally permitted"; aserivi on taulukossa (aw) jo erikseen.
if "481" in ships:
    _bad = "even if Ion cannon 30 cm 1 All round planetary defences"
    assert _bad in ships["481"]["sr"], "s.481: odotettu poimintavirhe puuttuu - tarkista extract.py"
    ships["481"]["sr"] = ships["481"]["sr"].replace(_bad, "even if planetary defences")

# --- Planetary defences: kolme profiilia, joita poimija ei saa (8.10.2026) ---
# extract.py lukee sivulta yhden profiilin ja vaatii seka TYPE/HITS- etta
# ARMAMENT-otsikon. Kaksi sivua jaa siksi vajaaksi:
#   s.516 FIRE SHIP: taysi statsirivi (Escort/1, 15 cm, 45 astetta, 1, 5+, 1)
#     mutta EI aseistustaulukkoa - alus on itse ase. Kirjan ainoa sellainen.
#   s.517: KOLME profiilia perakkain (Air Base, Defence Laser Silo, Missile
#     Silo); poimija sai vain ensimmaisen. s.499:n hintalista nimeaa kaikki
#     kolme rajoineen (0-8, 0-8, 0-4).
# Luettu sivuilta kasin (python pdf_text.py 516 / 517). Avain 517b/517c
# noudattaa Tau-konfiguraatioiden kaytantoa (458b...): pg on oikea sivu.
for _k in ("516", "517b", "517c"):
    assert _k not in ships, "profiili %s on jo: tarkista extract.py" % _k
assert ships["517"]["nm"] == "AIR BASE", ships["517"]["nm"]
ships["516"] = dict(
    pg=516, fl="HIGH ORBIT DEFENCES", nm="FIRE SHIP", bp=10, ty="Escort", hp=1,
    sp="15 cm", tn="45\u00b0", sh="1", ar="5+", tu="1", tl="TURRETS", qd=0,
    aw=[], op="", ol=[],
    sr=("\u2022 The controlling player can detonate a fire ship at any point in its "
        "movement phase, inflicting D3 Fire critical hits on every ship within 3D6 cm. "
        "As with any escort suffering a critical hit, escorts within the fire ship's "
        "blast will be automatically destroyed, as are any Ordnance markers. Remove "
        "the detonated fire ship and put a Blast marker in its place."))
ships["517b"] = dict(
    pg=517, fl="LOW ORBIT DEFENCES", nm="DEFENCE LASER SILO", bp=15, ty="Ground", hp=1,
    sp="0", tn="0", sh="0", ar="6+", tu="0", tl="TURRETS", qd=0,
    aw=[["Lance battery", "60 cm", "3", "Front"]], op="", ol=[], sr="")
ships["517c"] = dict(
    pg=517, fl="LOW ORBIT DEFENCES", nm="MISSILE SILO", bp=5, ty="Ground", hp=1,
    sp="0", tn="0", sh="0", ar="6+", tu="0", tl="TURRETS", qd=0,
    aw=[["Torpedoes", "30 cm", "6", "Front"]], op="", ol=[], sr="")
# s.337 ja s.347: "An Eldar Haven space station ... may be used as a Dark Eldar
# pirate base by trading its bombers for Slavebringer assault boats and its
# Pulsar Lances for Phantom Lances for no change in cost. It is otherwise
# unchanged." Kirja ei paina tukikohdalle omaa profiilia: Havenin (s.334)
# rivit vaihdettuina. Havittajat pysyvat (Darkstar 30 cm) - vaihto nimeaa vain
# pommittajat ja lanssit; Slavebringerin nopeus 30 cm on s.345:n taulukosta.
# Kantama 45 cm ja vahvuus 3 ovat Havenin omat ("otherwise unchanged");
# Dark Eldar -alusten phantom lancet ovat 30 cm (s.352), mita ei siirreta.
assert "334b" not in ships and ships["334"]["nm"] == "HAVEN SPACE STATION"
assert [a[0] for a in ships["334"]["aw"]] == ["Weapons battery", "Launch bays", "Pulsar lances"], ships["334"]["aw"]
ships["334b"] = dict(ships["334"])
ships["334b"]["aw"] = [list(ships["334"]["aw"][0]),
                       ["Launch bays", "Darkstar: 30 cm / Slavebringer: 30 cm", "5 squadrons", "\u2013"],
                       ["Phantom lances", "45 cm", "3", "All around"]]
ships["334b"]["ol"] = []

# Sivu 480 on yksi koottava Orbital-profiili, jossa Core-, Security-,
# Manufacturing- ja Habitat-moduulien SPECIAL-laatikot ovat eri puolilla
# sivua. Tavallinen yhden taulukon poimija saa tekstit mutta hukkaa otsikot ja
# ennen aseistusta olevan Core-laatikon. Säilytetään koko pelivaikutus tässä
# käsikirjan sanamuotoa tiivistäen.
if "480" in ships:
    ships["480"]["sr"] = (
        "• A core module supplies the command, communication, energy and sensor facilities "
        "for an array along with habitats for all key staff. A core module and all its "
        "ancillary modules are treated as one model for game purposes. "
        "• Normally individual orbital modules are assembled into arrays of up to five. "
        "The first module must be the core module and no more than four other modules can "
        "be added. An Orbital costs its core plus the sum of all added modules. "
        "• Each security module adds +1 turret to the Core module. "
        "• Each security module includes one of the defence systems below, at the points cost shown. "
        "• Orcas and Wardens assigned to guard an Orbital have a base leadership of 7 and "
        "cannot squadron with other escorts. "
        "• Up to four modules in all: security, manufacturing & research and habitat "
        "modules, each bought below (J171)."
    )

# Usealla Tau-profiilisivulla on kaksi tai kolme saman rungon vaihtoehtoista
# aseistuskonfiguraatiota. PDF-poimija lukee tarkoituksella vain sivun ensimmaisen
# taulukon, joten muut konfiguraatiot lisataan eksplisiittisina profiileina. Ne
# saavat synteettisen avaimen (esim. 458b), mutta kortin lahdesivu on yha 458.
# Xenos Vesselin nimetyt variantit. Kirjassa yksi listarivi 50 pisteella,
# mutta sivut 186-188 antavat kolme nimettya alusta samaan hintaan, kukin
# omalla aseellaan ja erikoissaannollaan. Ilman laajennusta ne ovat datassa
# mutta eivat kenenkaan saatavissa.
XENOS_VARIANTS = {
    "184": [
        ("184", None),                       # geneerinen, nimi ennallaan
        ("186", "Pthuxutl war cruiser"),
        ("187", "Fra'al raider"),
        ("188", "Nekulli whip"),
    ],
}
# Lahdelause, jonka on loydyttava sivun 184 SPECIAL-lohkosta. Jos kirja
# muuttuu, laajennus ei saa jaada voimaan vanhalla oletuksella.
XENOS_SOURCE = "all of them cost 50 points"

TAU_CONFIGS = {
    "458": [
        ("458", "Vash’ya Mk XXIII"),
        ("458b", "Bor’kan Mk XXIV", [
            ["Prow Railgun battery", "45 cm", "6", "Left/front/right"],
            ["Prow gravitic launcher", "20–40 cm", "8", "Front"],
            ["Port launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "2 squadrons", "–"],
            ["Starboard launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "2 squadrons", "–"],
            ["Port gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
            ["Starboard gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
            ["Dorsal gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
        ]),
    ],
    "460": [
        ("460", "Vash’ya"),
        ("460b", "T’olku", [
            ["Prow Railgun battery", "45 cm", "4", "Left/front/right"],
            ["Prow gravitic launcher", "20–40 cm", "6", "Front"],
            ["Port launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Starboard launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Port Railgun battery", "45 cm", "4", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "4", "Front/right"],
        ]),
    ],
    "462": [
        ("462", "Ke’lshan"),
        ("462b", "Dal’yth", [
            ["Prow Railgun battery", "45 cm", "2", "Left/front/right"],
            ["Port ion cannon", "30 cm", "1", "Left/front"],
            ["Starboard ion cannon", "30 cm", "1", "Front/right"],
            ["Port Railgun battery", "45 cm", "2", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "2", "Front/right"],
        ]),
    ],
    "470": [
        ("470", "T’olku"),
        ("470b", "Vior’la", [
            ["Port Railgun battery", "45 cm", "2", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "2", "Front/right"],
            ["Prow Railgun battery", "45 cm", "4", "Front"],
            ["Port ion cannon", "45 cm", "1", "Front"],
            ["Starboard ion cannon", "45 cm", "1", "Front"],
            ["Prow launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Prow gravitic launcher", "20–40 cm", "5", "Front"],
        ]),
    ],
    "472": [
        ("472", "Dal’yth"),
        ("472b", "Bork’an", [
            ["Port Railgun battery", "45 cm", "4", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "4", "Front/right"],
            ["Port gravitic hook", "–", "Capacity: 1 Warden", "–"],
            ["Starboard gravitic hook", "–", "Capacity: 1 Warden", "–"],
            ["Prow gravitic launcher", "20–40 cm", "3", "Front"],
        ]),
        ("472c", "Sa’cea", [
            ["Port Railgun battery", "45 cm", "3", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "3", "Front/right"],
            ["Port ion cannon", "30 cm", "1", "Left/front"],
            ["Starboard ion cannon", "30 cm", "1", "Front/right"],
            ["Prow gravitic launcher", "20–40 cm", "3", "Front"],
        ]),
    ],
}

# Il'Porrui-profiilin SPECIAL ja OPTIONS ovat kirjan jatkosivulla 473, joten
# yhden sivun yleispoiminta ei voi nahda niitä.
if "472" in ships:
    ships["472"]["sr"] = (
        "• A large number of Il’Porrui vessels were equipped with specialized gravitic hooks "
        "for supporting Kir’la “Warden” gunships so that it may have a form of escort on "
        "long-range emissary missions. These gravitic hooks are specially designed for "
        "Wardens and cannot be used to tow or count for any other kind of escort."
    )
    ships["472"]["op"] = (
        "• Emissary class cruisers can be equipped with a deflector that raises its "
        "prow armour to 6+ for +10 points. This is disabled whenever the vessel "
        "suffers a prow critical hit (repairable normally)."
    )
    ships["472"]["ol"] = parse_options(ships["472"]["op"])

# Sivun 255 (Chaos battle barge) OPTIONS-laatikossa on kaksi kertomus-
# kappaletta: "Pre-Heresy battle barges were widely emulated..." (oli oma
# "see text" -optio) ja Chosen Terminators -rivin hanta "A number of
# Primarchs...". Kumpikaan ei ole valinta. Sama kasittely kuin s.472:
# kuratoitu OPTIONS-teksti jasennetaan uudestaan, jolloin riippuvuudet
# (Chosen Terminators tarvitsee Chaos Space Marinesin) lasketaan oikein.
if "255" in ships:
    _op = ships["255"]["op"]
    assert _op.startswith("Pre-Heresy battle barges were widely emulated"), _op[:60]
    _tail = " A number of Primarchs, and even renowned Battle-Captains ordered subtle modifications"
    assert _tail in _op, "s.255: Primarchs-lause puuttuu"
    _op = _op[_op.index("\u2022 Chaos battle barges can be led"):]
    _op = _op[:_op.index(_tail)] + _op[_op.index(" \u2022 For no change in cost"):]
    ships["255"]["op"] = _op
    ships["255"]["ol"] = parse_options(_op)
    assert len(ships["255"]["ol"]) == 7, len(ships["255"]["ol"])
    _ct = next(o for o in ships["255"]["ol"] if o["t"].startswith("If Chaos Space Marines are taken"))
    assert _ct.get("dep") == 1 and _ct["t"].endswith("+10 points."), _ct

# Sivun 194 (Fra'al Battleship) OPTIONS-laatikon kaksi kappaletta ovat
# saantoja, eivat ostoja: "... they may be used as a substitution for an enemy
# in any scenario ..." ja "Up to two ships in a pirate fleet may be Fra'al
# battleships, rolling for leadership normally and counting as cruisers against
# the fleet list." Kortti tulosti ne "see text" -optioina (pistokoe 15 rivi 29).
# Ne siirretaan SPECIAL-saantoihin sellaisinaan.
if "194" in ships:
    _fr = ships["194"]
    assert len(_fr["ol"]) == 2 and all(o.get("c") is None for o in _fr["ol"]), _fr["ol"]
    assert _fr["ol"][1]["t"].startswith("Up to two ships in a pirate fleet"), _fr["ol"][1]["t"][:40]
    _fr["sr"] = (_fr["sr"] + " " + " ".join("• " + o["t"] for o in _fr["ol"])).strip()
    _fr["ol"] = []
    _fr["op"] = ""


def choice(text, cost, group, dep=None, group_max=1):
    """Tulostettava/rastitettava asevalinta.

    grp + gmax ohjaavat selaimessa poissulkevuutta. dep toteuttaa esimerkiksi
    toisen Impaler-moduulin, joka voidaan ottaa vain ensimmaisen jalkeen.
    """
    out = dict(t=text, c=cost, var=0, grp=group, gmax=group_max)
    if dep is not None:
        out["dep"] = dep
    return out


def weapon_set_options(prefix, group_prefix, count, choices):
    out = []
    for slot in range(1, count + 1):
        grp = "%s_%d" % (group_prefix, slot)
        for label, cost in choices:
            out.append(choice("%s %d — %s" % (prefix, slot, label), cost, grp))
    return out


# Kirjan aseistustaulukot sisaltavat jo kaikki alla olevat vaihtoehdot, mutta
# kortti tarvitsee rastitettavan valinnan ja builder oikean hinnan.
if "330" in ships:
    vampire = ships["330"]["ol"][0]
    ships["330"]["ol"] = [
        choice("Prow — weapons battery", 0, "dragon_prow"),
        choice("Prow — pulsar lance", 0, "dragon_prow"),
        choice("Keel — launch bays", 0, "dragon_keel"),
        choice("Keel — torpedoes", 0, "dragon_keel"),
        dict(vampire, dep=2),
    ]
if "331" in ships:
    ships["331"]["ol"] = [
        choice("Prow — weapons battery", 0, "wraith_prow"),
        choice("Prow — pulsar lance", 0, "wraith_prow"),
        choice("Keel — launch bays", 0, "wraith_keel"),
        choice("Keel — torpedoes", 0, "wraith_keel"),
    ]
if "332" in ships:
    ships["332"]["ol"] = [
        choice("Prow — weapons battery", 0, "shadowhunter_prow"),
        choice("Prow — shadow lance", 0, "shadowhunter_prow"),
    ]

if "352" in ships:
    ships["352"]["aw"] = [
        ["Prow weapons battery", "30 cm", "12", "Front"],
        ["Launch bays", "Fighters: 30 cm / Bombers: 20 cm / Assault Boats: 30 cm", "4 squadrons", "–"],
        ["Prow phantom lance", "30 cm", "2", "Front"],
        ["Prow torpedoes", "30 cm", "4", "Front"],
        ["Impaler assault module", "Attack Craft: 30 cm", "Special", "Front"],
    ]
    mimic = ships["352"]["ol"][-1]
    ships["352"]["ol"] = [
        choice("Additional armament — launch bays", 40, "torture_arm"),
        choice("Additional armament — prow phantom lance", 20, "torture_arm"),
        choice("Additional armament — prow torpedoes", 20, "torture_arm"),
        choice("Additional armament — Impaler module I", 20, "torture_arm"),
        choice("Additional armament — Impaler module II", 20, "torture_impaler_2", dep=3),
        mimic,
    ]
if "353" in ships:
    mimic = ships["353"]["ol"][0]
    ships["353"]["ol"] = [
        choice("Additional armament — weapons battery", 0, "corsair_arm"),
        choice("Additional armament — phantom lance", 0, "corsair_arm"),
        choice("Additional armament — torpedoes", 0, "corsair_arm"),
        choice("Additional armament — Impaler module", 0, "corsair_arm"),
        mimic,
    ]

# Hammer (s.374): "Prow bombardment cannon OR Prow torpedoes" ei ole
# rakennusvalinta - "In each turn, these launchas can either fire torpedoes or
# be used as a bombardment cannon." Molemmat rivit ovat aina aluksella, ja
# ampumisvalinta on SPECIAL-tekstissa (kayttajan loydos 10.9.2026).
if "374" in ships:
    assert not any("prow secondary" in o["t"].lower() for o in ships["374"]["ol"])
    assert not any(o.get("dep") is not None for o in ships["374"]["ol"])

if "432" in ships:
    ships["432"]["ol"] = (
        [choice("Prow — Pyro-acid battery", 30, "hive_prow"),
         choice("Prow — Feeder tentacles & massive claws", 15, "hive_prow"),
         choice("Prow — Bio-plasma spines", 20, "hive_prow"),
         choice("Prow — Boarding torpedoes", 25, "hive_prow"),
         choice("Thorax — Pyro-acid battery", 30, "hive_thorax"),
         choice("Thorax — Bio-plasma discharge", 20, "hive_thorax"),
         choice("Thorax — Launch bays", 20, "hive_thorax")] +
        weapon_set_options("Port/starboard set", "hive_side", 3,
                           [("Pyro-acid battery", 15),
                            ("Bio-plasma discharge", 20), ("Launch bays", 20)]))
if "434" in ships:
    ships["434"]["ol"] = (
        [choice("Prow — Pyro-acid battery", 20, "tycr_prow"),
         choice("Prow — Feeder tentacles", 10, "tycr_prow"),
         choice("Prow — Massive claws", 5, "tycr_prow"),
         choice("Prow — Boarding torpedoes", 10, "tycr_prow"),
         choice("Thorax — Feeder tentacles", 10, "tycr_thorax"),
         choice("Thorax — Massive claws", 5, "tycr_thorax"),
         choice("Thorax — Boarding torpedoes", 10, "tycr_thorax")] +
        weapon_set_options("Port/starboard set", "tycr_side", 2,
                           [("Pyro-acid battery", 15), ("Bio-plasma discharge", 20)]))
if "435" in ships:
    ships["435"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 15, "kraken_weapon"),
        choice("Weapon — Feeder tentacles", 5, "kraken_weapon"),
        choice("Weapon — Massive claws", 10, "kraken_weapon"),
        choice("Weapon — Bio-plasma discharge", 10, "kraken_weapon"),
        choice("Weapon — Boarding torpedoes", 15, "kraken_weapon"),
    ]
if "436" in ships:
    ships["436"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 5, "vanguard_weapon"),
        choice("Weapon — Feeder tentacles", 5, "vanguard_weapon"),
    ]
if "437" in ships:
    fireship = ships["437"]["ol"][-1]
    ships["437"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 10, "drone_weapon"),
        choice("Weapon — Feeder tentacles", 5, "drone_weapon"),
        choice("Weapon — Bio-plasma discharge", 5, "drone_weapon"),
        dict(fireship, grp="drone_weapon", gmax=1),
    ]
# J213 (docs/check-yourself S1041, S1043, S1058, S1059, S1062): ryhma rajaa
# aseen enintaan yhteen, mutta kirja vaatii yhden: "must be armed with one
# weapon chosen from the following list" (s.429, 431) ja hive shipin ja
# risteilijan luettelot "One prow weapon", "One thorax weapon" (s.430).
# resolveFleet raportoi ryhman, josta ei ole valittu mitaan.
_NEED = {
    "432": [("hive_prow", "one prow weapon", "A hive ship must be armed with weapons chosen from the "
             "following list: One prow weapon", 430),
            ("hive_thorax", "one thorax weapon", "A hive ship must be armed with weapons chosen from the "
             "following list: One thorax weapon", 430)],
    "434": [("tycr_prow", "one prow weapon", "A Tyranid cruiser must be armed with weapons chosen from the "
             "following list: One prow weapon", 430),
            ("tycr_thorax", "one thorax weapon", "A Tyranid cruiser must be armed with weapons chosen from the "
             "following list: One thorax weapon", 430)],
    "435": [("kraken_weapon", "one weapon", "A Kraken must be armed with one weapon chosen from the "
             "following list", 429)],
    "436": [("vanguard_weapon", "one weapon", "A Vanguard drone ship must be armed with one weapon chosen "
             "from the following list", 429)],
    "437": [("drone_weapon", "one weapon", "A Tyranid escort drone must be armed with one weapon chosen "
             "from the following list", 431)],
}
for _k, _needs in _NEED.items():
    assert _k in ships, "J213: profiili %s puuttuu" % _k
    for _g, _what, _src, _pg in _needs:
        assert any(o.get("grp") == _g for o in ships[_k]["ol"]), "J213: ryhmaa %s ei ole" % _g
    ships[_k]["need"] = [dict(grp=_g, what=_w, src=_s, pg=_p) for _g, _w, _s, _p in _needs]

# Orbital ja Waystation valitsevat yhden puolustusjarjestelman. Waystationin
# viimeinen Ion Cannon -rivi katosi PDF:n poikkeuksellisen suuren rivivalin takia.
for key in ("480", "481"):
    if key in ships:
        for o in ships[key]["ol"]:
            o.update(grp=key + "_defence", gmax=1)
if "481" in ships and not any("ion cannon" in a[0].lower() for a in ships["481"]["aw"]):
    ships["481"]["aw"].append(["Ion cannon", "30 cm", "1", "All round"])

# ---------------------------------------------- valikkoaseiden kytkennat
#
# {sivu: {optioindeksi: [aseistusrivin indeksit]}}
#
# Optio joka ei ole listassa on tavallinen lisaosto eika kytkeydy mihinkaan
# riviin; se ei siis voi piilottaa aseistusta. Sivuparit (Port + Starboard)
# ovat yksi valinta ja kaksi rivia, ja hive shipin kolme sivusettia
# osoittavat samoihin riveihin, koska kirja tulostaa sivuaseet kerran.
WEAPON_MENU = {
    "330": {0: [0], 1: [1], 2: [2], 3: [3]},          # Dragonship
    "331": {0: [0], 1: [1], 2: [2], 3: [3]},          # Wraithship
    "332": {0: [0], 1: [1]},                          # Shadowhunter
    # Torture: aw0 on perusaseistus; loput ovat lisaaseita.
    "352": {0: [1], 1: [2], 2: [3], 3: [4], 4: [4]},
    # Corsair: aw0 on perusaseistus (Str 2), aw1 on lisatty Str 3.
    "353": {0: [1], 1: [2], 2: [3], 3: [4]},
    "432": {                                          # Hive ship
        0: [0], 1: [1], 2: [2], 3: [3],               # keula
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10], 9: [11],               # sivusetti 1
        10: [7, 8], 11: [9, 10], 12: [11],            # sivusetti 2
        13: [7, 8], 14: [9, 10], 15: [11],            # sivusetti 3
    },
    "434": {                                          # Tyranid cruiser
        0: [0], 1: [1], 2: [2], 3: [3],               # keula
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10],                        # sivusetti 1
        9: [7, 8], 10: [9, 10],                       # sivusetti 2
    },
    "435": {0: [0], 1: [1], 2: [2], 3: [3], 4: [4]},  # Kraken
    "436": {0: [0], 1: [1]},                          # Vanguard drone
    "437": {0: [0], 1: [1], 2: [2]},                  # Escort drone
    "480": {0: [0], 1: [1], 2: [2], 3: [3]},          # Orbitals
    "481": {0: [0], 1: [1], 2: [2], 3: [3]},          # Waystation
}

for _pg, _map in WEAPON_MENU.items():
    if _pg not in ships:
        raise SystemExit("WEAPON_MENU: alusta %s ei ole" % _pg)
    _sh = ships[_pg]
    for _oi, _rows in _map.items():
        if _oi >= len(_sh["ol"]):
            raise SystemExit("WEAPON_MENU %s: optiota %d ei ole" % (_pg, _oi))
        for _r in _rows:
            if _r >= len(_sh["aw"]):
                raise SystemExit("WEAPON_MENU %s: aseriviä %d ei ole" % (_pg, _r))
        _sh["ol"][_oi]["aws"] = list(_rows)

# ------------------------------------------------------- SAANTOTUNNISTIMET
# Nimittaja voi nimeta kaksi tyyppia: "for every three cruisers or
# battlecruisers". Laiska ryhma pysahtyi ensimmaiseen sanaan ja "or
# battlecruisers" katosi aanettomasti, jolloin tarkistus laski liian
# pienen nimittajan ja merkitsi laillisen laivaston laittomaksi.
# Vaihtoehdoista pidempi kokeillaan ensin, koska laiska ryhma tyytyisi
# muuten lyhyempaan osumaan.
_TYPE = r"[\w\- ’']+?"
_TYPES = r"(?:" + _TYPE + r"\s+or\s+" + _TYPE + r"|" + _TYPE + r")"
# Lukusana on valinnainen: "for every cruiser" tarkoittaa yhta. Aiemmin
# tassa oli (\w+)?, joka nappasi lukusanan paikalle tyypin alun -
# "for every cruiser" jasentyi muotoon ("cruise", "r"), n("cruise") oli
# tyhja ja koko saanto katosi. Sallitaan vain oikeat lukusanat, ja
# luettelo tulee samasta NUM-taulusta jota n() kayttaa.
_COUNT = (r"(?:(\d[\d,]*|" +
          "|".join(sorted(NUM, key=len, reverse=True)) + r")\s+)?")
# Loppu ankkuroidaan virkkeen loppuun eika mihin tahansa valilyontiin.
# Ilman ankkuria laiska ryhma tyytyi ensimmaiseen sanavaliin ja
# "cruisers or heavy cruisers" typistyi muotoon "cruisers or heavy",
# jota yksikaan osio ei vastaa - jolloin koko saanto putosi tekstiksi.
RATIO_A = re.compile(
    r"(?:may\s+)?include\s+(?:up\s+to\s+)?(\w+)\s+([\w\- ’']+?)\s+(?:in\s+(?:your|the)\s+fleet\s+)?"
    # "for each" on sama asia kuin "for every": tyranidien
    # "up to 2 capital ships for each hive ship in the fleet".
    r"for\s+(?:every|each)\s+" + _COUNT + r"(" + _TYPES + r")"
    r"(?:\s+(?:included\s+)?in\s+(?:the|your|their)\s+fleet)?"
    r"(?=\s*[,.]|\s*$)", re.I)
RATIO_B = re.compile(
    r"for\s+every\s+(\w+)\s+([\w\- ’']+?)\s+(?:included\s+)?in\s+your\s+fleet,?\s+"
    r"you\s+may\s+(?:include|pick|take)\s+(\w+)", re.I)
PER_PTS_MAX = re.compile(
    r"max(?:imum)?\s+of\s+(\w+)\s+([\w\- ’']+?)\s+per\s+([\d,]+)\s*points", re.I)
PER_PTS = re.compile(
    # "include up to one X": ilman valinnaista "up to" -jatkoa
    # vasemmanpuoleisin osuma olisi "include" ja lukusanaksi tulisi
    # "up". "for every FULL 1,000 points" tarvitsee oman sanansa.
    r"(?:max\.?(?:imum)?\s+of\s+|(?:include\s+)?up\s+to\s+|include\s+)"
    r"(\w+)\s+([\w\- ’']+?)\s+"
    r"(?:in\s+(?:your|the)\s+fleet\s+)?(?:per|for\s+every)\s+"
    # "full" ei ole pelkka tayteszana: se kertoo pyoristyssuunnan.
    # "for every FULL 1,000 points" tarkoittaa 0-999 = ei yhtaan,
    # kun taas "per 500 points, or part" tarkoittaa 1-500 = yksi.
    r"(?P<full>full\s+)?([\d,]+)\s*points", re.I)
CAP = re.compile(r"include\s+up\s+to\s+(\w+)\s+([\w\- ’']+?)\s+in\s+(?:your|the)\s+fleet", re.I)
# Kirja kirjoittaa katon myos ilman "up to": "Your fleet may include
# no more than twelve cruisers." (Demiurg, s.487). Loppu
# ankkuroidaan pilkkuun, pisteeseen tai fleet-sanaan, jottei laiska
# ryhma niele lauseen loppua tyyppiin.
CAP2 = re.compile(r"(?:include|have|take)\s+no\s+more\s+than\s+(\w+)\s+([\w\- ’']+?)"
                  r"(?=\s*[,.]|\s+in\s+(?:your|the)\s+fleet|\s*$)", re.I)
# Pakollinen komentaja. Kirja kirjoittaa taman kahdella tavalla, ja
# aiemmin tunnistettiin vain jalkimmainen: 13 listaa 16:sta jai ilman
# tarkistusta. Ero on aito eika vain sanamuoto - "over 750" tarkoittaa
# yli 750:n, "750 or more" tarkoittaa 750:sta ylospain - joten
# vertailutapa kirjataan mukaan.
# "above" on sama asia kuin "over": Grey Knights -lista kirjoittaa
# "If the fleet is above 750 points an Inquisitor Lord must lead the fleet".
# Kolme sanamuotoa samalle asialle: "worth over 750", "is above 750",
# "has more than 750 points of ships". Kaikki tarkoittavat aidosti yli.
MAND_GT = re.compile(r"(?:worth\s+(?:over|above|more\s+than|greater\s+than)|"
                     r"is\s+(?:above|greater\s+than|more\s+than)|"
                     r"has\s+more\s+than)\s+"
                     r"([\d,]+)\s*(?:pts|points)", re.I)
MAND_GE = re.compile(r"(?:worth|of)\s+([\d,]+)\s*(?:pts|points)\s+or\s+more", re.I)
# Ilman tata ehtoa saanto osuisi myos lauseeseen "If your fleets is worth
# more than 750 pts it must include at least one Explorer" - siina vaatimus
# koskee yhta alusluokkaa, ei koko osiota, eika osiotason tarkistus vastaa
# sita. Vaaditaan siis johtamiseen viittaava sanamuoto.
MAND_LEADS = re.compile(r"(?:to\s+lead\s+it|lead\s+the\s+fleet|"
                        r"must\s+lead\s+(?:it|the\s+fleet)|"
                        r"include\s+an?\s+(?:commander|admiral|archmagos)|"
                        r"(?:commander|admiral)\s+must\s+be\s+included)", re.I)
SQD = re.compile(r"squadrons?\s+of\s+(\d+)\s*[–-]\s*(\d+)", re.I)
SECN = re.compile(r"^(\d+)\s*[–-]\s*(\d+)\s+([\w’' ]+?),?\s+chosen", re.I)
HAS_QUALIFIER = re.compile(r"for\s+every|\bper\s+[\d,]+\s*points|\bper\s+\w+\s+points", re.I)


def detect(sent):
    """Palauttaa saantodictin tai None. Tiukka: epavarmat jaavat tekstiksi."""
    m = PER_PTS_MAX.search(sent)
    if m and n(m.group(1)):
        return dict(kind="per_points", each=n(m.group(1)),
                    what=m.group(2).strip().lower(),
                    per=int(m.group(3).replace(",", "")))
    m = PER_PTS.search(sent)
    if m and n(m.group(1)):
        # Ryhma 3 on nyt nimetty full-ryhma, joten luku on ryhmassa 4.
        r = dict(kind="per_points", each=n(m.group(1)),
                 what=m.group(2).strip().lower(),
                 per=int(m.group(4).replace(",", "")))
        if m.group("full"):
            r["full"] = 1
        # s.372 Clanz: "one Warlord for every 500 points, or part, that the
        # fleet is worth - no more, no less" on tasmaara, ei vain yla-raja (J38).
        if re.search(r"no\s+more,?\s+no\s+less", sent, re.I):
            r["exact"] = 1
        return r
    m = RATIO_A.search(sent)
    if m and n(m.group(1)) and (n(m.group(3)) or m.group(3) is None):
        per = n(m.group(3)) if m.group(3) else 1
        if per:
            return dict(kind="ratio", allow=n(m.group(1)),
                        allow_type=m.group(2).strip().lower(),
                        per=per, per_type=m.group(4).strip().lower())
    m = RATIO_B.search(sent)
    if m and n(m.group(1)) and n(m.group(3)):
        return dict(kind="ratio", allow=n(m.group(3)), allow_type="@section",
                    per=n(m.group(1)), per_type=m.group(2).strip().lower())
    if "must" in sent.lower():
        m = MAND_GE.search(sent)
        over = False
        if not m:
            m = MAND_GT.search(sent)
            over = True
        if m:
            # Vartija ratkaistaan vasta osioon sidottaessa, koska vasta
            # silloin tiedetaan mista osiosta on kyse. Jos lause puhuu
            # johtamisesta, vartijaa ei tarvita lainkaan.
            return dict(kind="mandatory_at",
                        points=int(m.group(1).replace(",", "")), over=over,
                        needs_guard=not bool(MAND_LEADS.search(sent)))
    m = SQD.search(sent)
    if m:
        return dict(kind="squadron", min=int(m.group(1)), max=int(m.group(2)))
    # CAP vasta viimeisena, ja vain jos lauseessa EI ole suhde-/pisterajoitetta
    m = CAP.search(sent) or CAP2.search(sent)
    if m and n(m.group(1)) and not HAS_QUALIFIER.search(sent):
        return dict(kind="cap", max=n(m.group(1)), what=m.group(2).strip().lower())
    return None


def resolve_sections(phrase, sec_titles, own):
    """'cruisers or heavy cruisers' -> [osioindeksi, ...]. Tyhja = ei ratkennut."""
    if phrase in ("@section", "vessel from this section", "vessel from the list below"):
        return [own]
    parts = re.split(r"\s+or\s+|\s+and\s+|,\s*", phrase)
    norm = [sing(t) for t in sec_titles]
    idx = []
    for p in parts:
        p = sing(p)
        if not p:
            continue
        # tasmallinen osuma ensin: 'cruiser' EI saa osua 'battlecruiser'-osioon
        hit = norm.index(p) if p in norm else None
        if hit is None and len(p) > 5:
            cand = [i for i, t in enumerate(norm) if t.endswith(" " + p) or t == p]
            hit = cand[0] if len(cand) == 1 else None
        if hit is None:
            return []
        if hit not in idx:
            idx.append(hit)
    return idx


# Nakyviin paastettavan lauseen tunnistus. Toinen rivi lisattiin 7.9.2026:
# alkuperainen sanalista tunsi luvat ja kiellot mutta ei mekaanisia
# vaikutuksia, joten 72 patevaa lausetta jai nayttamatta - Mechanicus
# Gifts -vaikutukset, inkvisiittorien bonukset, Ork Gubbinit, tyranidien
# refitit ja laskentasaannot ("Warspheres do not count against cruiser
# limits"). Sana "can" lisattiin 7.9.2026, mutta vain yhdessa
# laivastonrakennuksen verbin kanssa - pelkkana se on kertomuksessa yhta
# yleinen kuin saannoissa ("battlefleets can vary massively").
# Lauseet, jotka lausesuodatin pudottaisi mutta joiden on naytava: rivin
# oma kuvaus ("+1 modifier on boarding") tai saanto ilman saantosanaa.
# Jokaisen on osuttava vahintaan kerran, muuten ajo kaatuu (kohta 8).
KEEP_TEXT = [
    # s.318: "gives the vessel a re-roll which may be used on itself, another
    # capital ship in the same squadron or an escort squadron within 15 cm" -
    # lause on myos 0-3-lukumaarasaanto, ja ilman tata se katosi
    # komentajakortilta (pistokoe 7 rivi 76).
    dict(list_has="Eldar \u2014 Iyanden Craftworld", has="gives the vessel a re-roll"),
    # s.319 Prince Yriel: "He has the following additions as part of his point
    # cost: ... 2. His vessel is equipped with Vampire raiders." ja "The fleet
    # list chosen becomes the parent fleet when it comes to using reserve ships
    # from the other fleet." Kumpikaan ei osu RULEY-sanastoon, ja ne katosivat
    # komentajakortilta (pistokoe 15 rivi 59).
    dict(list_has="Eldar \u2014 Iyanden Craftworld", sec="RESERVES AND ALLIES",
         has="His vessel is equipped with Vampire raiders"),
    dict(list_has="Eldar \u2014 Iyanden Craftworld", sec="RESERVES AND ALLIES",
         has="The fleet list chosen becomes the parent fleet"),
    dict(list_has="Orks \u2014 Cyclops Cluster", has="+1 modifier on boarding"),
    dict(list_has="Orks \u2014 Waaagh!", has="+1 modifier on boarding"),
]
def keep_text(name, title, sent):
    for fx in KEEP_TEXT:
        if fx["list_has"] in name and fx["has"] in sent and (
                not fx.get("sec") or fx["sec"].strip().lower() == title.strip().lower()):
            fx["_used"] = fx.get("_used", 0) + 1
            return True
    return False

RULEY = re.compile(r"\b(may|must|cannot|can not|no more|only|per|each|at least|up to|"
                   r"instead|counts? as|not be|never)\b"
                   r"|\bdo(?:es)?\s+not\s+count\b|\bcounts?\s+(?:toward|against)\b"
                   r"|\bno\s+restrictions?\b|\b(?:is|are)\s+reduced\b"
                   r"|\breduced\s+(?:to|by)\b|\badds?\s+\+?\d|\+\d+\s+to\s+\w"
                   # "increased by +1" on saanto siina missa "reduced by".
                   r"|\bincreased?\s+(?:by|to)\b"
                   # Kolme lausetta koko kirjassa, kaikki saantoja.
                   # Tarkein on tyranidien hinnoittelun tulkinta:
                   # "the points cost indicated provides you with one
                   # port weapon and one starboard weapon".
                   r"|\bpermitted\b|\bprovides?\s+you\s+with\b"
                   # Komentajien lauseet (P1-8e): "Admirals get one Fleet
                   # Commander re-roll included in their points cost",
                   # "improves its Leadership to the value shown" - re-rollien
                   # maara ja Ld ovat komentajakortin sisalto, ei kerrontaa.
                   r"|\bre-?rolls?\b|\bleadership\b"
                   # Kirja kayttaa sanaa "can" samassa merkityksessa kuin
                   # "may". Pelkka \bcan\b toisi 45 lausetta joista 17 on
                   # kertomusta ("battlefleets can vary massively"), joten
                   # vaaditaan lisaksi laivastonrakennuksen verbi: nain
                   # lauseita on 28 ja kertomusta kolme. Mukana mm.
                   # "Any race can be used to provide auxiliary vessels
                   # except Orks, Dark Eldar, Necrons and Tyranids" ja
                   # jokaisen Chaos-listan ORDNANCE-lause.
                   r"|\bcan\s+(?:also\s+|only\s+|still\s+|now\s+|not\s+)?"
                   r"(?:be\s+)?(?:include|take|taken|takes|use|used|uses|"
                   r"have|has|purchase|purchased|choose|chosen|select|"
                   r"selected|replace|replaced|replaces|carry|carried|add|"
                   r"added|upgrade|upgraded|equip|equipped|field|fielded|"
                   r"act|acts|double|assign|assigned|combine|combined|"
                   r"buy|bought)\b"
                   # "gains a +1 bonus" on sama saanto kuin "gains +1".
                   r"|\bgains?\s+(?:an?\s+)?\+?\d"
                   r"|\breceives?\s+(?:one|two|an?|\+?\d)|\bignores?\b"
                   # Pistehinnan nimeava lause on aina saanto: se kertoo
                   # mita jostain maksetaan. Ilman tata jai nayttamatta 32
                   # lausetta, mm. "+35 points for its Space Marine crew",
                   # "A second re-roll can be purchased for +25 points" ja
                   # tyranidien bio-refittien kuvaukset hintoineen.
                   r"|[+-]?\d[\d,]*\s*(?:pts|points)\b"
                   # Kielto ja poikkeus ovat saantokielta siina missa lupa.
                   # Naiden mukana tulee 74 lausetta, joista noin kymmenen on
                   # kertomusta - hyvaksytty vaihtokauppa, koska joukossa on
                   # mm. jokaisen faktion attack rating, necronien
                   # reactive hull -poikkeukset ja tyranidien poikkeavat
                   # kriittiset osumat, jotka puuttuivat kokonaan.
                   r"|\bdo(?:es)?\s+not\b|\bdon'?t\b"
                   r"|\bwill\s+(?:not|never|always)\b"
                   # Kirja kirjoittaa attack ratingin kolmella tavalla:
                   # "attack rating", "attack (initiative) rating" ja
                   # "attack or initiative rating". Miinusmerkkinen
                   # modifikaattori on yhta mekaaninen kuin plus.
                   r"|\battack\s+(?:\S+\s+){0,2}rating\b"
                   r"|[+-]\d+\s+(?:leadership|ld)\b|leadership\s+modifier"
                   # Mitta ja noppa ovat yhta mekaanisia kuin hinta: lause
                   # joka sanoo "15 cm" tai "roll a D6" on saanto. Naiden
                   # mukana tuli 74 lausetta, kaytannossa kaikki patevia -
                   # hyokkaysalusten nopeustaulukot, Slaaneshin -2
                   # johtajuus 15 cm:n sateella, craftworldien
                   # painovoimakaivot, Daemonshipin sijoitus.
                   r"|\d+\s*cm\b|\b\d?D[36]\b", re.I)


# --- osiota tarkempi poiminta ---------------------------------------------
# resolve_sections osaa vain osiotarkkuuden, ja se riittaa lahes aina.
# Bastion Fleets painaa kuitenkin taistelulaivat, battlecruiserit ja grand
# cruiserit saman otsikon alle, jolloin "yksi taistelulaiva kolmea
# risteilijaa kohden" laski koko osion: kaksi grand cruiseria luettiin
# kahdeksi taistelulaivaksi ja laillinen laivasto merkittiin laittomaksi.
#
# Poiminta rajaa osion aluksen nimen perusteella. Nama ovat kasin
# kirjoitettuja poikkeuksia eivatka jasentimen paatelmia: jasentimen
# kuuluukin pysya tiukkana, jotta epavarma lause jaa tekstiksi eika muutu
# vaaraksi tarkistukseksi. Jokaisen kohdan on osuttava tasan kerran, mika
# tarkistetaan ajon lopuksi.
# Pistokoe 18 (kirjainventaario): Chaos-listojen isot alukset ja s.288:n lauseet.
_CHAOS_CAP = [dict(sec="Planet Killer"), dict(sec="Chaos Space Hulk"), dict(sec="Battleships"),
              dict(sec="Grand Cruisers"), dict(sec="Heavy Cruisers"), dict(sec="Cruisers")]
_CHAOS_HULK_LISTS = (("Chaos \u2014 Incursion", False), ("Chaos \u2014 Black Crusade", True),
                     ("Chaos \u2014 Tzeentch", True), ("Chaos \u2014 Nurgle", True),
                     ("Chaos \u2014 Khorne", True), ("Chaos \u2014 Slaanesh", True))
_HULK_WITH = ("It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone "
              "Fortress or ships that must be used as flagships such as the Terminus Est.")
_HULK_BS = "A Chaos fleet including a Space Hulk may have no more than two other battleships."

RULE_PICKS = [
    # Osoittajaan vain taistelulaivat. Nimittajaan risteilijat JA
    # battlecruiserit, kuten lause sanoo; grand cruiserit jaavat pois,
    # minka kirja toteaa erikseen seuraavassa virkkeessa.
    # Lause ei jasenny koneellisesti, koska Bastion Fleetsissa ei ole
    # omaa Battlecruisers-osiota: kaikki kolme tyyppia ovat otsikon
    # "Battleships" alla. resolve_sections ei siksi loyda nimittajan
    # toista puolta, ja lause jaa tekstiksi. Rakennetaan saanto tassa.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battleship in your fleet for every three cruisers",
         src="You may include up to one battleship in your fleet for every "
             "three cruisers or battlecruisers.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=3, per_type="cruisers or battlecruisers",
                   allow_pick=[dict(sec="Battleships", re="battleship")],
                   per_pick=[dict(sec="Cruisers"),
                             dict(sec="Battleships", re="battlecruiser")])),
    # Toinen puoli samasta osiosta. Tama jai tekstiksi, koska kirjassa
    # valiotsikko on kiinni virkkeen alussa eika lause siksi jasentynyt.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battlecruiser or grand cruiser in your fleet "
                   "for every two cruisers",
         src="You may include up to one battlecruiser or grand cruiser "
             "in your fleet for every two cruisers.",
         rule=dict(kind="ratio", allow=1,
                   allow_type="battlecruiser or grand cruiser",
                   # Osion otsikko on "Battleships", mika on vaara otsikko
                   # talle saannolle. Kirjan oma valiotsikko on oikea.
                   label="Battlecruisers & Grand Cruisers",
                   per=2, per_type="cruisers",
                   allow_pick=[dict(sec="Battleships",
                                    re="battlecruiser|grand cruiser")],
                   per_pick=[dict(sec="Cruisers")])),

    # Chaos Incursion on ainoa lista jossa komentaja on pakollinen ilman
    # pisterajaa. Kirjan lause kieltaa rajan nimenomaisesti ("even if it
    # is worth 750 points or less"), joten yleiset kaavat eivat voi sita
    # tunnistaa. Pisteraja 0 tarkoittaa "aina".
    # --- Demiurg ---------------------------------------------------------
    dict(list_has="Demiurg", sec="Battleships",
         from_text="one battleship for every two cruiser-class vessels",
         src="Your fleet may include one battleship for every two "
             "cruiser-class vessels in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=2, per_type="cruiser-class vessels",
                   allow_pick=[dict(sec="Battleships")],
                   per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Demiurg", sec="Kroot Vessels",
         from_text="one Kroot Warsphere in the fleet for every 750 points",
         src="The fleet may have one Kroot Warsphere in the fleet for every "
             "750 points in the fleet or portion thereof.",
         rule=dict(kind="per_points", each=1, per=750,
                   what="Kroot Warsphere",
                   pick=[dict(sec="Kroot Vessels")])),

    # --- Chaos: Abaddon ja nimetyt taistelulaivat (laivastopistokoe 10.9.) --
    # s.234: "You may include Abaddon the Despoiler as the Warmaster in any
    # Chaos Fleet worth more than 1,000 points." Abaddon ON Warmaster: han
    # tayttaa pakollisen Warmasterin (match_src alla) eika ole Warmasterin
    # rinnalla. Lause jaa tekstiksi, koska se on Abaddonin kortin saanto.
    dict(list_has="Black Crusade", sec="Abaddon",
         from_text="Abaddon the Despoiler as the Warmaster in any Chaos Fleet",
         keep_text=True,
         src="You may include Abaddon the Despoiler as the Warmaster in any "
             "Chaos Fleet worth more than 1,000 points.",
         rules=[dict(kind="allowed_at", points=1000, over=True, label="Abaddon",
                     pick=[dict(sec="Abaddon")]),
                dict(kind="cap", max=1, label="Warmaster or Abaddon",
                     pick=[dict(sec="Chaos Warmaster"), dict(sec="Abaddon")])]),
    dict(list_has="Black Crusade", sec="Chaos Warmaster",
         match_src="A Chaos Warmaster (and their required capital ship) must be taken",
         set=dict(pick=[dict(sec="Chaos Warmaster"), dict(sec="Abaddon")])),
    # s.237, 241, 245, 249: "A fleet 1,000 points or more may include the X
    # as one of its battleships, subject to normal restrictions." Lause jai
    # tekstiksi kaikilla neljalla listalla (Planet Killerin vastaava oli jo
    # saantona).
    dict(list_has="Chaos — Tzeentch", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Scion of Prospero",
         src="A fleet 1,000 points or more may include the Scion of Prospero as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Scion of Prospero",
                   pick=[dict(sec="Battleships", re="^scion of prospero")])),
    dict(list_has="Chaos — Nurgle", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Terminus Est",
         src="A fleet 1,000 points or more may include the Terminus Est as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Terminus Est",
                   pick=[dict(sec="Battleships", re="^terminus est")])),
    dict(list_has="Chaos — Khorne", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Slaverer",
         src="A fleet 1,000 points or more may include the Slaverer as one of its "
             "battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Slaverer",
                   pick=[dict(sec="Battleships", re="^slaverer")])),
    dict(list_has="Chaos — Slaanesh", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Wage of Sin",
         src="A fleet 1,000 points or more may include the Wage of Sin as one of "
             "its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Wage of Sin",
                   pick=[dict(sec="Battleships", re="^wage of sin")])),

    # --- Laivueet (laivastopistokoe S2 10.9.) ------------------------------
    # s.455 "Defenders are fielded in squadrons of 2–6 ships." Saanto on
    # SQUADRONS-osiossa, jossa ei ole yhtaan alusta, joten se ei mitannut
    # mitaan. pick nimeaa luokan: Messengerit saavat toimia yksin.
    dict(list_has="Tau — Merchant Fleet", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    dict(list_has="Tau — Commerce Protection", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    # s.174 "A single squadron of 2-6 Rogue Trader escorts and auxiliary
    # vessels may accompany each Rogue Trader capital ship in a fleet, in any
    # mix desired. Separately, ... cargo ships ... these squadrons can only
    # contain cargo ships". Koko on jasentimen squadron-saanto; maara per
    # alus lisataan suhdelukuna. Nate Montes: Siluria "as a cruiser",
    # Havoc "an escort".
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="ESCORTS",
         match_src="A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship",
         add=[dict(kind="ratio", allow=6, per=1, label="Rogue Trader escorts per capital ship",
                   allow_type="Rogue Trader escorts and auxiliary vessels",
                   per_type="Rogue Trader capital ships",
                   allow_pick=[dict(sec="ESCORTS", re="^(?!armed cargo)"),
                               dict(sec="NOTES FROM NATE MONTES", re="^havoc")],
                   per_pick=[dict(sec="CAPITAL SHIPS"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])]),

    # --- Eldar Hero ja Prince Yriel (laivastopistokoe S5 10.9.) -----------
    # s.316/317: "Your fleet may be led by an Eldar Hero, in place of its
    # normal fleet commander." Hero tayttaa pakollisen Pirate Princen eika
    # ole sen rinnalla (sama malli kuin Abaddon s.234).
    # Kumpikin Corsair-lista omana rivinaan: jokainen korjaus osuu tasan kerran.
    *[dict(list_has=nm, sec="Eldar Hero",
           from_text="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander",
           keep_text=True,
           src="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander.",
           rule=dict(kind="cap", max=1, label="Fleet commander (Pirate Prince or Eldar Hero)",
                     pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    *[dict(list_has=nm, sec="Pirate Prince",
           match_src="If the fleet is worth over 750 points a Pirate Prince must be included",
           set=dict(pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    # s.318 sama Hero-lause Iyandenissa; s.319 "Yriel may be taken instead
    # of the Hero Fleet Commander as listed in the Corsair and Craftworld
    # Eldar fleet lists." Yriel korvaa Heron, Hero Autarchin: yksi kolmesta.
    dict(list_has="Iyanden", sec="RESERVES AND ALLIES",
         from_text="Yriel may be taken instead of the Hero Fleet Commander",
         keep_text=True,
         src="Yriel may be taken instead of the Hero Fleet Commander as listed in the "
             "Corsair and Craftworld Eldar fleet lists.",
         rule=dict(kind="cap", max=1, label="Fleet commander (Autarch, Eldar Hero or Prince Yriel)",
                   pick=[dict(sec="Autarch"), dict(sec="Eldar Hero"),
                         dict(sec="RESERVES AND ALLIES", re="^prince yriel")])),
    dict(list_has="Iyanden", sec="Autarch",
         match_src="If the fleet is worth over 750 points, an Autarch must be included",
         set=dict(pick=[dict(sec="Autarch"), dict(sec="Eldar Hero"),
                        dict(sec="RESERVES AND ALLIES", re="^prince yriel")])),

    # --- Tau -------------------------------------------------------------
    # Nelja saantoa jotka nimeavat ALUSLUOKAN siella missa moottori
    # odottaa osion otsikkoa. Kaikki neljä jaivat siksi pelkaksi
    # tekstiksi, vaikka ne ovat listojen keskeisimpia rajoitteita.
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Cruisers",
         from_text="one Hero class starship for every Merchant or Explorer",
         src="It may also include up to one Hero class starship for every "
             "Merchant or Explorer in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Hero class starship",
                   per=1, per_type="Merchants or Explorers",
                   label="Hero class starships",
                   allow_pick=[dict(sec="Cruisers", re="^hero")],
                   per_pick=[dict(sec="Cruisers", re="^merchant"),
                             dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Battleships",
         from_text="it must include at least one Explorer",
         # Kirjassa lukee 'your fleets', ja se jatetaan sellaiseksi:
         # nayteta lause on kirjan oma.
         src="If your fleets is worth more than 750 pts it must include at "
             "least one Explorer.",
         rule=dict(kind="mandatory_at", points=750, over=True,
                   label="Explorer class starships",
                   pick=[dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    # s.367 (pistokoe 19, J47): "Each Ork hulk must be assigned an Ork Warlord
    # to command it." Kukin hulk tarvitsee oman Warlordin: Warlordeja vahintaan
    # yhta monta kuin hulkeja. Aluksen ja komentajan sidontaa ei mallinneta
    # (J8), mutta lukumaara ei vaadi sita.
    dict(list_has="Orks \u2014 Waaagh!", sec="SPACE HULKS",
         from_text="Each Ork hulk must be assigned an Ork Warlord",
         src="Each Ork hulk must be assigned an Ork Warlord to command it.",
         keep_text=True,
         rule=dict(kind="compare", op=">=", label="Warlords for Ork hulks (one each)",
                   a_pick=[dict(sec="WARLORD")], b_pick=[dict(sec="SPACE HULKS")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),

    # Tyranidien skwadronikoot. Kirja kirjoittaa ne omaan
    # SQUADRONS-osioonsa, jossa ei ole yhtaan alusta, joten omaan
    # osioonsa sidottuna saanto ei mittaisi mitaan. Lisaksi kirja
    # kirjoittaa valin sanana ("6 to 12"), ei viivalla, jota kaava
    # yksinaan odottaa.
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="SQUADRONS",
         from_text="squadrons of 6 to 12 models",
         src="Vanguard drone ships and Kraken may be deployed in squadrons "
             "of 6 to 12 models. You may combine the two types in a single "
             "squadron if you wish.",
         rule=dict(kind="squadron", min=6, max=12,
                   secs=["VANGUARD DRONE SHIPS", "KRAKEN"])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="SQUADRONS",
         from_text="squadrons of 1 to 12 vessels",
         src="Tyranid Escorts come as squadrons of 1 to 12 vessels, while "
             "all other types are individuals and may not deploy in "
             "squadrons.",
         rule=dict(kind="squadron", min=1, max=12, secs=["ESCORTS"])),
    # Necronien tombship-suhdeluku. Kone ei voi jasentaa tata, koska
    # nimittaja on ALUKSEN nimi eika osion otsikko: osio on "Cruisers"
    # ja siina on seka Scythe- etta Shroud-luokka, joten "for every
    # Scythe class harvest ship" ei vastaa mitaan osiota. Lisaksi lause
    # paattyy sanoihin "it contains", jotka laiska tyyppiryhma nielisi
    # osaksi nimea. Rakennetaan saanto tassa, kuten Bastion Fleetsissa.
    dict(list_has="Necrons", sec="Tombships",
         from_text="one tombship for every Scythe class harvest ship",
         src="Your fleet may include up to one tombship for every Scythe "
             "class harvest ship it contains.",
         rule=dict(kind="ratio", allow=1, allow_type="tombship",
                   per=1, per_type="Scythe class harvest ships",
                   allow_pick=[dict(sec="Tombships")],
                   per_pick=[dict(sec="Cruisers", re="scythe")])),
    dict(list_has="Chaos \u2014 Incursion", sec="FLEET COMMANDER",
         from_text="You must include a Chaos Warmaster in your fleet",
         src="You must include a Chaos Warmaster in your fleet, even if it "
             "is worth 750 points or less.",
         rule=dict(kind="mandatory_at", points=0, over=False)),
    # ================= kohta 8 (9.9.2026): kirjasta luetut saannot, jotka ==========
    # jasennin ei tunnista mutta jotka moottori nyt osaa valvoa. Jokainen
    # lause on referenssi/NN_*.json:ssa statuksella enforced ja sivulla.
    # --- pisterajaan sidottu lupa (allowed_at) ---
    dict(list_has="Black Crusade", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Tzeentch", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Nurgle", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Khorne", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Slaanesh", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Fortress-Monastery",
         from_text="worth at least 2,000 points, it may include one Fortress-Monastery",
         src="If your fleet is worth at least 2,000 points, it may include one Fortress-Monastery.",
         rule=dict(kind="allowed_at", points=2000, label="Fortress-Monastery", pick=[dict(sec="Fortress-Monastery")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Emperor's Inquisition", sec="Inquisitor Lord",
         from_text="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord",
         src="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord.",
         rule=dict(kind="allowed_at", points=750, label="Inquisitor Lord", pick=[dict(sec="Inquisitor Lord")])),
    dict(list_has="Bakka Sector", sec="Admiral",
         from_text="Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath",
         src="An Imperial Bakka Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath, who must always be placed on a battleship, though it not necessarily be the most expensive one present.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1500, label="Lord Admiral Rath", pick=[dict(sec="Admiral", re="rath")])),
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points",
         src="You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. Furthermore an Ordo Malleus Inquisitor Lord must lead in the fleet.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, basis="remainder", label="Grey Knights Battlebarge",
                   pick=[dict(sec="CAPITAL SHIPS", re="battlebarge|battle barge")],
                   cond_pick=[dict(sec="FLEET COMMANDER", re="ordo malleus")], cond_min=1)),
    # --- pisterajaan sidottu maara yhdelle riville (per_points + pick) ---
    dict(list_has="Space Marines \u2014 Codex", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Armageddon Sector", sec="RESERVES",
         from_text="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points",
         src="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points (or portion thereof) in the fleet.",
         rule=dict(kind="per_points", each=2, per=500, what="Endurance and Defiant class light cruisers", label="Endurance & Defiant light cruisers", pick=[dict(sec="Cruisers", re="endurance|defiant")])),
    dict(list_has="Emperor's Inquisition", sec="CAPITAL SHIPS",
         from_text="up to one Grey Knights Strike Cruiser may be taken for every 500 points",
         src="If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                   cond_pick=[dict(sec="Inquisitor Lord")], cond_min=1)),
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="One Grey Knights Strike Cruiser may be taken per 500 points",
         src="One Grey Knights Strike Cruiser may be taken per 500 points (e.g. one from 0-500 points, two from 501-1000 points, etc.).",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")])),
    dict(list_has="Pirates and Wolf Packs", sec="Pirate Captains",
         from_text="A Pirate Captain may be embarked on a cruiser for every 500 points",
         src="A Pirate Captain may be embarked on a cruiser for every 500 points or portion thereof in a fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Pirate Captain", label="Pirate Captains", pick=[dict(sec="Pirate Captains")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Battleships",
         from_text="up to one Custodian per FULL 750 points of Tau vessels",
         src="Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. Allied, Subject, Mercenary and Reserve vessels don't count toward this total.",
         keep_text=True,
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Custodian", label="Custodian class starships",
                   pick=[dict(sec="Battleships", re="custodian")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Rogue Traders",
         from_text="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships",
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet.",
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Rogue Trader cruiser", label="Rogue Trader cruisers",
                   pick=[dict(sec="Rogue Traders", re="rogue trader cruiser|dauntless|endeavour")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    # --- kahden joukon vertailu (compare) ---
    dict(list_has="Bastion Fleets", sec="ORDNANCE",
         from_text="combined numbers of Endurance and Defiant class vessels may not exceed",
         src="The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels may not exceed the number of Endeavour class light cruisers in the fleet.",
         keep_text=True,
         rule=dict(kind="compare", op="<=", label="Endurance & Defiant vs Endeavour",
                   a_pick=[dict(sec="Cruisers", re="endurance|defiant")], b_pick=[dict(sec="Cruisers", re="endeavour")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="There cannot be more Stronghold than Bastion vessels",
         src="There cannot be more Stronghold than Bastion vessels in the fleet.",
         rule=dict(kind="compare", op="<=", label="Stronghold vs Bastion",
                   a_pick=[dict(sec="Demiurg Vessels", re="stronghold")], b_pick=[dict(sec="Demiurg Vessels", re="bastion")])),
    dict(list_has="Demiurg", sec="Cruisers",
         from_text="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined",
         src="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined.",
         rule=dict(kind="compare", op=">", label="Demiurg Commerce Vessels vs other cruisers",
                   a_pick=[dict(sec="Cruisers", re="bastion|citadel")], b_pick=[dict(sec="Cruisers", re="^(?!bastion|citadel)")])),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="CAPITAL SHIPS",
         from_text="at least half of which must be Rogue Trader Cruisers",
         src="Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, following the basic profile for this ship.",
         keep_text=True,
         rules=[dict(kind="cap", max=12, what="capital ships", label="Capital ships (incl. Demiurg)",
                     pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")]),
                dict(kind="compare", op=">=", a_mult=2, label="Rogue Trader cruisers & Endeavours: at least half",
                     a_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser|endeavour")],
                     b_pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")])]),
    # --- vahimmaissuhde (min_ratio) ---
    dict(list_has="Dark Eldar", sec="ESCORTS",
         from_text="must contain at least three escorts for every capital ship",
         src="However, Dark Eldar fleets must contain at least three escorts for every capital ship taken.",
         rule=dict(kind="min_ratio", min=3, label="Escorts per capital ship",
                   allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="between 6 and 12 escort class ships for each hive ship",
         src="You may include between 6 and 12 escort class ships for each hive ship.",
         rules=[dict(kind="min_ratio", min=6, label="Escorts per hive ship (min)",
                     allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="HIVE SHIPS")]),
                dict(kind="ratio", allow=12, allow_type="escort class ships", per=1, per_type="hive ship", label="Escorts per hive ship (max)",
                     allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="HIVE SHIPS")])]),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="at least six escort drones for every hive ship",
         src="The fleet must have at least six escort drones for every hive ship in the fleet.",
         keep_text=True,
         rule=dict(kind="min_ratio", min=6, label="Escort drones per hive ship",
                   allow_pick=[dict(sec="ESCORTS", re="escort drone")], per_pick=[dict(sec="HIVE SHIPS")])),
    # --- ehdolliset rajat ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="If no hive ships are chosen, only Kraken and Vanguard drone ships",
         src="If no hive ships are chosen, only Kraken and Vanguard drone ships may be included in the fleet.",
         rule=dict(kind="conditional_cap", label="Without a hive ship: only Kraken & Vanguard",
                   pick=[dict(sec="ESCORTS", re="^(?!kraken|vanguard)"), dict(sec="CAPITAL SHIPS")],
                   cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1, max_unmet=0, max_met=None)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Kroot",
         from_text="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers",
         src="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers in the fleet.",
         rule=dict(kind="conditional_cap", label="Kroot Warsphere",
                   pick=[dict(sec="The Kroot")], cond_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")], cond_min=3,
                   max_unmet=0, max_met=1)),
    dict(list_has="Da Ork Clanz", sec="Space Hulks",
         from_text="An Ork fleet with at least three Warlords may include one Space Hulk",
         src="An Ork fleet with at least three Warlords may include one Space Hulk.",
         rule=dict(kind="conditional_cap", label="Space Hulk",
                   pick=[dict(sec="Space Hulks")], cond_pick=[dict(sec="WARLORD")], cond_min=3, max_unmet=0, max_met=1)),
    # --- Pistokoe 18 (kirjainventaario) lohkot CH ja IN ----------------------
    # J24 s.241/245/249: Daemonship-osuus jumalalistoilla. Pohja on kaikki isot
    # alukset; suluissa luetellut (nimetty barge, Khornella taistelulaivat)
    # eivat voi ottaa paivitysta, ja se on jo rivien ehdoissa. Lippulaivan
    # sidontaa ei mallinneta (J8).
    *[dict(list_has=nm, sec="DAEMONSHIPS", from_text=ft, keep_text=True, src=src,
           rule=dict(kind="upgrade_ratio", per=per, allow=1, label=lab, up_sec="DAEMONSHIPS",
                     up_re="^daemonship", per_pick=_CHAOS_CAP))
      for nm, ft, src, per, lab in (
          ("Chaos \u2014 Nurgle", "Up to a third of the capital ships",
           "Up to a third of the capital ships (not the Terminus Est or flagship) in a Plaguefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           3, "Daemonships (up to a third of the capital ships)"),
          ("Chaos \u2014 Khorne", "Up to a quarter of the capital ships",
           "Up to a quarter of the capital ships (not battleships or the flagship) in a Berzerker Fleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           4, "Daemonships (up to a quarter of the capital ships)"),
          ("Chaos \u2014 Slaanesh", "Up to half of the capital ships",
           "Up to half of the capital ships (not the Wage of Sin or the flagship) in a Pleasurefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           2, "Daemonships (up to half of the capital ships)"))],
    # J25 s.235: "The Planet Killer also counts as a battleship when working
    # out how many heavy cruisers and cruisers the fleet requires." J26 s.288:
    # Space Hulk "counts as a battleship for purposes of taking another so in
    # order to take a second battleship, the fleet must already have six
    # cruisers" - mutta "there is no minimum point requirement or ship
    # prerequisite for fielding a Chaos Space Hulk" (at_least).
    *[dict(list_has=nm, sec="Battleships",
           match_src="You may include up to one battleship in your fleet for every three cruisers or heavy cruisers",
           set=dict(allow_pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else [])
                    + [dict(sec="Chaos Space Hulk")],
                    at_least=dict(cond_pick=[dict(sec="Chaos Space Hulk")], count=1)))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J26 s.288: poissulut ja enintaan kaksi muuta taistelulaivaa. Lista
    # sanoo vain "See it's profile for restrictions"; saanto on profiilissa.
    *[dict(list_has=nm, sec="Chaos Space Hulk", match_src="You may include up to one Space Hulk in the fleet",
           add=[dict(kind="conditional_cap", label="Chaos Space Hulk: not with the Planet Killer or a mandatory flagship",
                     pick=[dict(sec="Chaos Space Hulk")],
                     cond_pick=([dict(sec="Planet Killer")] if pk else [])
                     + [dict(sec="Battleships", re="^(terminus est|wage of sin|scion of prospero)")],
                     cond_min=1, max_unmet=None, max_met=0, src=_HULK_WITH)]
               # J52 s.245: "Bezerker Fleets led by a Space Hulk may have more than two
               # battleships, but other restrictions remain unchanged."
               + ([] if "Khorne" in nm else [
                   dict(kind="conditional_cap", label="Battleships with a Chaos Space Hulk",
                        pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else []),
                        cond_pick=[dict(sec="Chaos Space Hulk")], cond_min=1, max_unmet=None, max_met=2,
                        src=_HULK_BS)]))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J27 s.49: "An Emperor class battleship can only be taken as reserves
    # unless Admiral Rath leads the fleet." s.50: "one reserve battleship for
    # every three Bakka battleships in the fleet"; "one reserve cruiser,
    # battlecruiser or grand cruiser for every three Bakka cruisers". s.14:
    # "Reserves are still subject to the restrictions on minimum and maximum
    # numbers of certain types of vessels" -> Jovian battlecruiser-suhteeseen.
    dict(list_has="Bakka", sec="Battleships",
         from_text="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads",
         src="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads the fleet.",
         rule=dict(kind="requires", label="Emperor class battleship as reserve (three Bakka battleships or Rath)",
                   if_pick=[dict(sec="Battleships", re="^emperor")],
                   then_pick=[dict(sec="Battleships", re="^(?!emperor)")], min=3,
                   unless_pick=[dict(sec="Admiral", re="rath")])),
    dict(list_has="Bakka", sec="RESERVES",
         from_text="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser",
         keep_text=True,
         src="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser, battlecruiser "
             "or grand cruiser for every three Bakka cruisers in the fleet, one reserve battleship for every three "
             "Bakka battleships in the fleet, etc.",
         rule=dict(kind="ratio", allow=1, per=3, label="Reserve cruisers, battlecruisers and grand cruisers",
                   allow_pick=[dict(sec="RESERVES")], per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Bakka", sec="Battlecruisers",
         match_src="You may include up to one battlecruiser in your fleet for every two cruisers",
         set=dict(allow_pick=[dict(sec="Battlecruisers"), dict(sec="RESERVES", re="jovian")])),
    # J28 s.151: "Up to half of the Grey Knights strike cruisers in a fleet
    # may replace their launch bays with one of the refits listed below, in
    # any mix desired." Lause on profiilissa; saanto listan GK-rivin rinnalle.
    *[dict(list_has=nm, sec="CAPITAL SHIPS", match_src=ms,
           add=[dict(kind="option_ratio", per=2, allow=1,
                     label="Grey Knights strike cruisers with launch bays replaced (up to half)",
                     pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                     opt_re="replace (its )?launch bays",
                     src="Up to half of the Grey Knights strike cruisers in a fleet may replace their launch "
                         "bays with one of the refits listed below, in any mix desired.")])
      for nm, ms in (("Grey Knights", "One Grey Knights Strike Cruiser may be taken per 500 points"),
                     ("The Emperor's Inquisition", "up to one Grey Knights Strike Cruiser may be taken"))],
    # J32 s.373: "However, no more than one of each of the named Ork
    # battleships may be in the fleet, no more than one 'Uge ship may be taken
    # in the fleet for every two kroozers, and a Space Hulk may only be taken
    # by a fleet of no less than 1500 points." Nimettyjen (0-1) raja on jo
    # rivien mx:ssa; lause jaa nakyviin (keep_text).
    dict(list_has="Da Ork Clanz", sec="USING SKWADRONS",
         from_text="no more than one \u2018Uge ship may be taken in the fleet for every two kroozers",
         keep_text=True,
         src="However, no more than one of each of the named Ork battleships may be in the fleet, no more than "
             "one \u2018Uge ship may be taken in the fleet for every two kroozers, and a Space Hulk may only be "
             "taken by a fleet of no less than 1500 points.",
         rules=[dict(kind="ratio", allow=1, per=2, label="'Uge ships (one per two kroozers)",
                     allow_pick=[dict(sec="\u2018Uge ship skwadron")], per_pick=[dict(sec="Big ship skwadron")]),
                dict(kind="allowed_at", points=1500, over=False, label="Space Hulk (1,500 pts or more)",
                     pick=[dict(sec="Space Hulks")])]),
    # s.174: "If a fleet has more than one Rogue Trader cruiser or also
    # includes more than one squadron of transports, a Veteran Rogue Trader
    # must be assigned to a Rogue Trader cruiser." Siluria kuuluu mukaan "as a
    # cruiser" (Nate Montes, s.174); kuljetuslaivueet ovat Heavy Transportit ja
    # rahtialukset ("any number of cargo ships of any type (whether or not the
    # scenario requires transports)"). Pistokoe 18 (J23).
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="If a fleet has more than one Rogue Trader cruiser",
         src="If a fleet has more than one Rogue Trader cruiser or also includes more than one squadron of transports, a Veteran Rogue Trader must be assigned to a Rogue Trader cruiser.",
         rules=[dict(kind="requires", label="Veteran Rogue Trader required (two or more Rogue Trader cruisers)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"), dict(sec="NOTES FROM NATE MONTES", re="^siluria")],
                     if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1),
                dict(kind="requires", label="Veteran Rogue Trader required (two or more transport squadrons)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="transport"), dict(sec="ESCORTS", re="cargo")],
                     if_units=True, if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1)]),
    # J213 s.174: "A Veteran Rogue Trader may lead each Rogue Trader cruiser in
    # a fleet." Osion otsikkokatto (2) paasti kaksi Veterania yhdelle
    # risteilijalle (docs/check-yourself S0345). Risteilijat kuten ylla:
    # CAPITAL SHIPS -osion cruiserit ja Siluria "as a cruiser".
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may lead each Rogue Trader cruiser",
         src="A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.",
         keep_text=True,
         rule=dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=1,
                   per_type="Rogue Trader cruisers", label="Veteran Rogue Traders (one per Rogue Trader cruiser)",
                   allow_pick=[dict(sec="Veteran Rogue Traders")],
                   per_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Commander",
         from_text="If the fleet includes a Custodian, a Kor",
         src="If the fleet includes a Custodian, a Kor\u2019O must lead it.",
         rule=dict(kind="requires", label="Custodian needs a Kor\u2019O",
                   if_pick=[dict(sec="Battleships", re="custodian")], then_pick=[dict(sec="Commander", re="kor.o\\b|kor.o.mesme")], min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="The fleet must include at least one squadron of escort-sized cargo ships",
         src="The fleet must include at least one squadron of escort-sized cargo ships of any type (whether or not the scenario requires transports), in a squadron of 2 to 6 ships.",
         keep_text=True,
         rule=dict(kind="mandatory_at", points=0, over=False, label="Cargo ship squadron",
                   pick=[dict(sec="TRANSPORTS", re="cargo|freighter|q-ship|escort carrier"), dict(sec="ESCORTS", re="cargo vessel")])),
    # --- pisteosuudet ---
    dict(list_has="Pirates and Wolf Packs", sec="BRIGANDS",
         from_text="Up to 10% of a pirate fleet may be made up of alien escorts",
         src="Up to 10% of a pirate fleet may be made up of alien escorts from any race except Tyranids, Necrons or vessels that require support from a capital ship of their race.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="total", label="Alien escorts (10 % of the fleet)",
                   pick=[dict(sec="ESCORTS", re="xenos")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ORDNANCE",
         from_text="Up to 10 % of the fleet",
         src="Up to 10 % of the fleet\u2019s points allowance may be spent on Ordnance markers as long as at least one hive ship is chosen.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="limit", label="Ordnance markers (10 % of the allowance)",
                   pick=[dict(sec="ORDNANCE")], cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="No more than 1/3 of the fleet",
         src="No more than 1/3 of the fleet\u2019s total transport value can be made up of heavy transports.",
         keep_text=True,
         rule=dict(kind="points_share", frac=0.3334, of="pick", label="Heavy transports (1/3 of transport value)",
                   pick=[dict(sec="TRANSPORTS", re="heavy transport")], of_pick=[dict(sec="TRANSPORTS")])),
    # --- porrastettu raja ---
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    # --- paivitykset suhteessa aluksiin ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship",
         src="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet.",
         rule=dict(kind="upgrade_ratio", per=1, allow=1, label="Hive Mind Influence re-rolls",
                   up_sec="FLEET COMMANDER", up_re="hive mind influence", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Imperative can be purchased per two hive ships",
         src="A maximum of one Hive Mind Imperative can be purchased per two hive ships in the fleet, though a single Hive Mind Imperative may be purchased as long as the fleet contains at least one hive ship.",
         rule=dict(kind="upgrade_ratio", per=2, allow=1, min_one=True, label="Hive Mind Imperatives",
                   up_sec="FLEET COMMANDER", up_re="hive mind imperative", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET RULES (pg. 423\u2013428)", late=True, keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rules=[dict(kind="unit_upgrade_max", max=3, label="Refits per hive ship", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="HIVE SHIPS")]),
                dict(kind="unit_upgrade_max", max=2, label="Refits per cruiser", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="CAPITAL SHIPS")]),
                dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="ESCORTS")])]),
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="FLEET RULES (pg. 423\u2013428)", keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rule=dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS",
                   unit_pick=[dict(sec="VANGUARD DRONE SHIPS"), dict(sec="KRAKEN")])),
    # --- suhdeluvut, joita jasennin ei tunnista ---
    dict(list_has="Rogue Traders \u2014 Exploration", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers",
         src="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. At least one Veteran Rogue Trader must be assigned to a Rogue Trader cruiser in the fleet.",
         keep_text=True,
         rules=[dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=2, per_type="Rogue Trader cruisers", min_one=True, label="Veteran Rogue Traders",
                     allow_pick=[dict(sec="Veteran Rogue Traders")], per_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")]),
                dict(kind="mandatory_at", points=0, over=False, label="Veteran Rogue Trader", pick=[dict(sec="Veteran Rogue Traders")])]),
    dict(list_has="Demiurg", sec="ESCORTS",
         from_text="For every three Demiurg capital ships in the fleet, it may include one squadron",
         src="For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts.",
         rule=dict(kind="ratio", allow=1, allow_type="squadron of Tau or Rogue Trader escorts", per=3, per_type="Demiurg capital ships", units=True, label="Tau & Rogue Trader escort squadrons",
                   allow_pick=[dict(sec="Tau Escorts"), dict(sec="Rogue Trader Escorts")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers", re="bastion|citadel")])),
    # Iyanden: Autarchin Dragonship-lippulaiva ei kuulu suhdelukuun.
    dict(list_has="Iyanden", sec="Dragonships",
         match_src='Your fleet may include up to one Dragonship for every two Wr', set=dict(exempt=dict(cond_pick=[dict(sec="Autarch", re="autarch")], cond_min=1, count=1))),
]


def pick_secs(picks, sec_titles, where):
    """[{sec:'Cruisers', re:'...'}] -> [{sec:3, re:'...'}]."""
    out = []
    for p in picks:
        want = p["sec"].strip().lower()
        hit = [i for i, t in enumerate(sec_titles) if t.strip().lower() == want]
        assert len(hit) == 1, ("%s: osiota %r ei loydy tasan kerran, "
                               "osiot: %s" % (where, p["sec"], sec_titles))
        # Pyydetty osion nimi jaa talteen vartijaa varten: osioindeksi voi
        # siirtya myohemmin, ja vaara mutta olemassa oleva indeksi ei
        # nayta mistaan.
        q = dict(sec=hit[0], _t=p["sec"].strip().lower())
        if p.get("re"):
            q["re"] = p["re"]
        out.append(q)
    return out


# --- naytettavan tekstin siivous ------------------------------------------
# Kolme erillista vikaa, jotka kaikki syntyvat samasta syysta: FLEET RULES
# -lohko poimii kokonaisen sivualueen kirjasta, ja siella on saantojen
# seassa myos kertomusta ja hintataulukoita.
#
# Lausetason suodatinta EI tehda. Kokeilin sita: sanat "only" ja "never"
# erottavat kertomuksen saannosta huonosti, ja 326 ehdokkaasta valtaosa
# oli aitoja saantoja - Warp Translation, necronien kriittiset osumat,
# tyranidien refitit. Vaara pudotus on pahempi kuin nakyva turha lause,
# joten karsitaan vain se mika voidaan todeta varmaksi.

# 1) Kokonaan kertomukselliset osiot. Nama on luettu lause lauseelta.
#    Jokaisen on osuttava tasan kerran, muuten ajo kaatuu.
LORE_SECTIONS = [
    # Bakan "FLEET RULES (pg. 42-47)" ei ole enaa olemassa: ne sivut
    # kuuluvat Armageddonin sivualaan, ja rules_pages ei enaa poimi
    # edellisen listan sivuja. Sama kertomus poistuu nyt Armageddonin
    # omista osioista alempana.
    dict(list_has="Emperor's Inquisition", sec="FLEET RULES (pg. 132–137)"),
    dict(list_has="Rogue Traders", sec="FLEET RULES (pg. 168–173)"),
    dict(list_has="Armageddon Sector", sec="THE FIRST TYRANNIC WAR"),
    dict(list_has="Armageddon Sector", sec="LORD ADMIRAL ZACCARIUS RATH"),
    dict(list_has="Armageddon Sector", sec="THE FORGE WORLD OF BAKKA"),
    dict(list_has="Armageddon Sector", sec="SEGMENTUM TEMPESTUS"),
    dict(list_has="Dominion", sec="SPACE MARINE DOMINION FLEETS"),
]

# 1b) Osiot jotka eivat kuulu tahan listaan lainkaan.
#
#     Kirjan sivut 368-371 ovat ORK CLANZ -saannot. Ne osuvat
#     Waaagh!-listan sivualalle (366-371) vain siksi, etta Clanz-lista
#     alkaa vasta sivulta 372. Sivu 368 sanoo asian suoraan:
#     "The Ork Clanz rules can be used in addition to the normal Ork
#     rules, but only with its dedicated Clanz fleet list."
#     Ilman tata poistoa Waaagh!-lista tarjosi 14 Gubbins-paivitysta ja
#     kuusi klaanietua, joita kirja ei siina listassa salli.
#
#     Poisto ajetaan vasta upgrades.annotate:n JALKEEN, koska
#     Gubbins-hinnasto ja klaanien hinnat kopioidaan Clanz-listalle
#     naista samoista osioista.
# 1c) Listat joissa osion otsikon maararaja on SKWADRONIN koko, ei
#     laivaston yhteismaara. Da Ork Clanz kuvaa jokaisen osion
#     skwadronin mallina ("1-2 Kroozers", "3-10 Escorts", "1-4 Roks"),
#     ja sivu 373 sanoo: "There is no restriction for what kinds or how
#     many of what type of skwadrons are in the fleet." Laivastossa saa
#     siis olla useita Rok-skwadroneja, mutta otsikkoluvusta tehty
#     osiolaskuri antoi virheen jo viidennesta Rokista.
#
#     Sovellus ei mallinna runkoalusten skwadroneja - kappalemaara on
#     vain saattajilla - joten skwadronin kokoa ei voi valvoa. Se
#     kerrotaan tekstina.
HEAD_IS_SQUADRON = ["Orks \u2014 Da Ork Clanz"]
_HEAD_SQ_USED = [0]

DROP_SECS = [
    dict(list_has="Waaagh!", sec="ORK CLANZ"),
    dict(list_has="Waaagh!", sec="USING ORK CLANZ"),
    dict(list_has="Waaagh!", sec="MUSTERIN' DA CLANZ"),
    dict(list_has="Waaagh!", sec="CLAN UPGRADES"),
    dict(list_has="Waaagh!", sec="MOB RULE"),
    dict(list_has="Waaagh!", sec="YOUNG GUNZ"),
    dict(list_has="Waaagh!", sec="GUBBINS"),
    dict(list_has="Waaagh!", sec="MORE GUBBINS"),
]

# 2) Hintataulukon rivit. Kirjan listasivulla rivi on muotoa
#    "Despoiler class battleship (pg 266).............400 pts", ja
#    poiminnassa nama liimautuvat seuraavan saantolauseen eteen. Rivit
#    ovat jo omina valittavina riveinaan, joten ne ovat tassa pelkkaa
#    kohinaa. Sama sisalto kahdessa muodossa on juuri sita sekaannusta
#    josta palautteessa huomautettiin.
# Rivin nimiosa saa olla enintaan kuusi sanaa. Ilman tata rajaa kaava
# soisi aitoa lausetta: "Torture class cruisers may choose one of the
# following for the points shown: 1-2 Impaler Assault Modules.....+20 pts"
# menettaisi alkunsa, joka on itse saanto.
_LEAD = r"(?:\(?\d+\s*[-–]\s*\d+\)?\s+|\d+[:.]\s+)?"     # "0-1 ", "6: "
_NAME = r"(?:[^.\s]+[ \t]+){0,5}[^.\s]*?"                # <= 6 sanaa
_COST = r"(?:\+?\d[\d,]*\s*(?:pts|points)(?:\s*each)?|Free)"

# "Veteran Captain (Ld +1).........+50 pts", "Shokk-Attack Lance.....Free"
PRICE_ROW = re.compile(r"^\s*" + _LEAD + r"(?:" + _NAME + r"\.{2,}\s*)?"
                       + _COST + r"\b[\s.]*", re.I)
# "Grey Knights Strike Cruiser (pg 151)......vvv" - hinta voi puuttua tai
# olla korruptoitunut, mutta sivuviite tunnistaa rivin silti.
PRICE_HEAD = re.compile(r"^\s*" + _LEAD + _NAME +
                        r"\(pg\.?\s*\d+\)\.{2,}\s*(?:v+|" + _COST +
                        r")?[\s.]*", re.I)


def strip_price_rows(t):
    """Poistaa hintataulukon rivit lauseen alusta. Palauttaa None jos
    lauseesta ei jaa muuta kuin hintoja.

    Vain hintarivin sisaltanyt lause voi pudota kokonaan. Ilman tata
    ehtoa lyhyt mutta patea lause katosi: "Re-rolls: 1 per turn." on
    Abaddonin uudelleenheittojen maara, ei kohinaa."""
    orig = t
    prev = None
    while prev != t:
        prev = t
        t = PRICE_HEAD.sub("", t)
        t = PRICE_ROW.sub("", t)
    t = t.strip()
    if t == orig.strip():
        return orig
    # Jaljelle jaanyt pelkka valiotsikko tai tyhja -> ei nayteta.
    if len(t) < 25 or not re.search(r"[a-z]{3}\s+[a-z]{3}", t):
        return None
    return t


def apply_rule_picks(name, title, sec_titles, rules, text):
    """Palauttaa (rules, text) korjausten jalkeen."""
    for fx in RULE_PICKS:
        if fx["list_has"] not in name or fx.get("late"):
            continue
        # list_is: "Rogue Traders" on myos kahden muun listan nimen alku.
        if fx.get("list_is") and fx["list_is"] != name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        where = "%s / %s" % (name, title)
        if "match_src" in fx:
            hit = [r for r in rules if fx["match_src"] in r.get("src", "")]
            assert len(hit) == 1, ("%s: lahdelause %r osui %d saantoon"
                                   % (where, fx["match_src"], len(hit)))
            patch = dict(fx.get("set") or {})
            for k in list(patch):
                if k == "pick" or k.endswith("_pick"):
                    patch[k] = pick_secs(patch[k], sec_titles, where)
            if "exempt" in patch and "cond_pick" in patch["exempt"]:
                patch["exempt"] = dict(patch["exempt"], cond_pick=pick_secs(patch["exempt"]["cond_pick"], sec_titles, where))
            if "at_least" in patch:
                patch["at_least"] = dict(patch["at_least"], cond_pick=pick_secs(patch["at_least"]["cond_pick"], sec_titles, where))
            hit[0].update(patch)
            # add: toinen saanto samasta lauseesta. s.174 RT-saattajat: koko
            # 2-6 on jasentimen squadron-saanto, maara per alus suhdeluku.
            for rule in fx.get("add", []):
                # Oma src, kun saanto on profiilisivulla eika listan lauseessa (s.288).
                r = dict(rule, src=rule.get("src") or hit[0]["src"], ok=True)
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        r[k] = pick_secs(r[k], sec_titles, where)
                if "allow_pick" not in r:
                    r["sec"] = list(hit[0].get("sec") or [])
                rules = rules + [r]
        else:
            hit = [t for t in text if fx["from_text"] in t]
            assert len(hit) == 1, ("%s: tekstilause %r osui %d kertaan"
                                   % (where, fx["from_text"], len(hit)))
            if not fx.get("keep_text"):
                text = [t for t in text if t not in hit]
            new_rules = []
            for rule in (fx.get("rules") or [fx["rule"]]):
              r = dict(rule, src=fx["src"], ok=True)
              # "pick" on sama rakenne kuin allow_pick/per_pick, mutta
              # pisterajoille ja pakollisuudelle: osio plus nimisuodatin.
              # Kohta 8: kaikki *_pick-avaimet (a_pick, b_pick, cond_pick,
              # of_pick, if_pick, then_pick, unit_pick) ratkaistaan samoin.
              for k in list(r):
                  if k == "pick" or k.endswith("_pick"):
                      r[k] = pick_secs(r[k], sec_titles, where)
              if "exempt" in r and "cond_pick" in r["exempt"]:
                  r["exempt"] = dict(r["exempt"], cond_pick=pick_secs(r["exempt"]["cond_pick"], sec_titles, where))
              if "at_least" in r:
                  r["at_least"] = dict(r["at_least"], cond_pick=pick_secs(r["at_least"]["cond_pick"], sec_titles, where))
              # up_sec (paivitysosio) ratkaistaan vasta kun upgrades.annotate
              # on luonut osiot (BIO-ENHANCEMENTS syntyy siella): ks. loppu.
              new_rules.append(r)
            for r in new_rules:
              if "secs" in r:
                # Saanto voi koskea muita osioita kuin sita jossa lause
                # on. Tyranidien SQUADRONS-osiossa ei ole yhtaan alusta,
                # joten omaan osioon sidottu skwadronisaanto ei mittaisi
                # mitaan.
                want = [x.strip().lower() for x in r.pop("secs")]
                r["sec"] = [i for i, t in enumerate(sec_titles)
                            if t.strip().lower() in want]
                assert len(r["sec"]) == len(want), (
                    "%s: osioita %r ei loydy (osiot: %s)"
                    % (where, want, sec_titles))
              elif "allow_pick" not in r:
                # Muut kuin suhdeluvut sidotaan omaan osioonsa.
                idx = [i for i, t in enumerate(sec_titles)
                       if t.strip().lower() == title.strip().lower()]
                assert len(idx) == 1, ("%s: osiota ei loydy tasan kerran"
                                       % where)
                r["sec"] = idx
              rules = rules + [r]
        fx["_used"] = fx.get("_used", 0) + 1
    return rules, text

# --- kasin lisatyt listarivit ---------------------------------------------
# Rivi jonka kirja mainitsee mutta jonka hinta on painovirheena
# lukukelvoton, joten jasennin ei voi poimia sita. Jokaisen lisayksen on
# osuttava tasan kerran ja sen lahdelauseen on loydyttava osion
# saantotekstista - muuten hintaa ei keksita vaan ajo kaatuu.
ENTRY_ADDS = [
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         src=r"One Grey Knights Strike Cruiser may be taken per 500 points",
         entry=dict(l="Grey Knights Strike Cruiser", r=151, p=165, a=0,
                    mx=None, k="unit",
                    nt="The book's price on pg. 145 is unreadable ('vvv'); "
                       "165 pts is what the same ship costs on pg. 138.")),
]


# Rivikohtainen maararaja jonka kirja kirjoittaa lauseeksi eika rivin
# eteen. Kirja merkitsee rajan yleensa muotoon "0-1 Nimi.....500 pts",
# ja se poimitaan koneellisesti. Necronien Sepulchre on poikkeus: rivi
# on pelkka "Sepulchre.....+50 pts" ja raja on edellisessa virkkeessa.
# Lahdelauseen on loydyttava osion tekstista, muuten ajo kaatuu.
ENTRY_LIMITS = [
    dict(list_has="Necrons", sec="Tombships", entry="Sepulchre", mx=1,
         src=r"A single tombship may be upgraded to carry a Sepulchre"),
    # Kolme Chaos-paivitysta joilla kirja antaa tasman lukumaaran.
    # "Including the flagship" tarkoittaa etta lippulaiva lasketaan
    # mukaan, ei etta se olisi pakollinen - raja on siis laivastotason.
    dict(list_has="Chaos \u2014 Tzeentch", sec="FORCES OF CHAOS",
         entry="Warp Beasts", mx=2,
         src=r"Up to two capital ships \(including the flagship\)"),
    dict(list_has="Chaos \u2014 Nurgle", sec="FORCES OF CHAOS",
         entry="Ark of Pestilence", mx=3,
         src=r"Up to three capital ships with the Mark of Nurgle"),
    dict(list_has="Chaos \u2014 Slaanesh", sec="FORCES OF CHAOS",
         entry="Siren\u2019s Summon", mx=2,
         src=r"Up to two capital ships with the Mark of Slaanesh"),
    # s.486: Demiurgin re-rollit ostetaan laivastolle kerran ("purchased by
    # the fleet as a whole") - kumpikin rivi korkeintaan kerran laivastossa.
    # fxg: rivit ovat saman ostoksen vaihtoehtoja - "The fleet gets one re-roll
    # and can purchase extra re-rolls at the cost shown": One tai Two, ei
    # molempia eri aluksille (kolmea ei myyda). Pistokoe 19, J41.
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # Necronit samoin: "purchased by the fleet as a whole" (s.404).
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # J77 s.145: "The vessel embarking the Inquisitor Lord or one Grey Knights
    # vessel may take Grey Knight Terminators." - yksi alus laivastossa.
    dict(list_has="Grey Knights", sec="ORDNANCE AND UPGRADES",
         entry="Grey Knights Terminators", mx=1,
         src=r"The vessel embarking the Inquisitor Lord or one Grey Knights vessel may take Grey Knight Terminators"),
    # Rogue Traders Exploration s.177: "no more than one Stronghold may be taken"
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Demiurg",
         entry="Stronghold Commerce Vessel", mx=1,
         src=r"no more than one Stronghold may be taken"),
]


def apply_entry_limits(name, title, raw, ents):
    for fx in ENTRY_LIMITS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: lahdelause %r ei loydy osion tekstista"
            % (name, title, fx["src"]))
        hit = [e for e in ents if str(e.get("l", "")).lower()
               == fx["entry"].strip().lower()]
        assert len(hit) == 1, ("%s / %s: rivi %r loytyi %d kertaa"
                               % (name, title, fx["entry"], len(hit)))
        hit[0]["mx"] = fx["mx"]
        if fx.get("fxg"):
            hit[0]["fxg"] = fx["fxg"]
        fx["_used"] = fx.get("_used", 0) + 1


def apply_entry_adds(name, title, raw, ents):
    for fx in ENTRY_ADDS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: lahdelause %r ei loydy osion tekstista"
            % (name, title, fx["src"]))
        lab = fx["entry"]["l"].lower()
        if any(str(e.get("l", "")).lower() == lab for e in ents):
            continue
        ents.append(dict(fx["entry"]))
        fx["_used"] = fx.get("_used", 0) + 1



# --------------------------------------------------- osioindeksien vartija
# Osioindeksi on hiljainen viite: jos osio siirtyy tai poistuu, indeksi
# osoittaa yha johonkin - vaaraan osioon. Bastion Fleetsin taistelulaivasuhde
# kaatui juuri tahan. Siksi jokainen viittaus kantaa osion NIMEN, ja nimi
# tarkistetaan uudelleen jokaisen siirron jalkeen. Nimi jaa myos dataan,
# jotta domain.js voi verrata sen ennen laskentaa.
#
# Viittausten muodot:
#   ylatason lista        sec / allow_sec / per_sec  = [3, 4]   -> "<key>_sn"
#   pick-sanakirja        {"sec": 3, "re": ...}                 -> "sn"
#   paivitysosio          {"up_sec": 7, ...}                    -> "up_sn"
_SEC_LIST_KEYS = ("sec", "allow_sec", "per_sec")
_SEC_COUNT = [0, 0]        # [viittauksia, tarkistettuja uudelleen]


def _sec_names_walk(node, titles, where, stamp_new):
    if isinstance(node, list):
        for x in node:
            _sec_names_walk(x, titles, where, stamp_new)
        return
    if not isinstance(node, dict):
        return
    for k in list(node):
        v = node[k]
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            _sec_names_one(node, k + "_sn", [_sec_title(titles, i, where, k) for i in v],
                           where, k, stamp_new)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            _sec_names_one(node, "sn" if k == "sec" else "up_sn",
                           _sec_title(titles, v, where, k), where, k, stamp_new)
        elif isinstance(v, (list, dict)) and not k.endswith("_sn") and k != "sn":
            _sec_names_walk(v, titles, where, stamp_new)


def _sec_title(titles, i, where, k):
    assert 0 <= i < len(titles), ("%s: %s osoittaa osioon %d, osioita on %d"
                                  % (where, k, i, len(titles)))
    return titles[i]


def _sec_names_one(node, namekey, now, where, k, stamp_new):
    # Yksi viittaus = yksi indeksi, myos listamuodossa (sec=[3, 4] on kaksi).
    n = len(now) if isinstance(now, list) else 1
    was = node.get(namekey)
    if was is None:
        if stamp_new:
            node[namekey] = now
            _SEC_COUNT[0] += n
        return
    assert was == now, (
        "%s: %s osoittaa osioon %r, piti olla %r - osio on siirtynyt tai "
        "poistunut ilman etta indeksia korjattiin" % (where, k, now, was))
    _SEC_COUNT[1] += n


def stamp_section_names(secs, where, stamp_new=True):
    """Leimaa ja tarkistaa yhden listan saantojen osioviittaukset."""
    titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec.get("rules") or []:
            _sec_names_walk(r, titles, "%s / %s" % (where, sec["t"]), stamp_new)


def check_section_names(lists, where, stamp_new=True):
    for Lz in lists:
        stamp_section_names(Lz["secs"], "%s: %s" % (where, Lz["nm"]), stamp_new)


def count_section_refs(node, acc):
    """Viittauksia yhteensa ja niista nimettyja - sama laskenta kuin
    acceptance.py:ssa, jotta luvut eivat voi erkaantua."""
    if isinstance(node, list):
        for x in node:
            count_section_refs(x, acc)
        return acc
    if not isinstance(node, dict):
        return acc
    for k, v in node.items():
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            acc[0] += len(v)
            if isinstance(node.get(k + "_sn"), list) and len(node[k + "_sn"]) == len(v):
                acc[1] += len(v)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            acc[0] += 1
            if node.get("sn" if k == "sec" else "up_sn") is not None:
                acc[1] += 1
        elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
            count_section_refs(v, acc)
    return acc


lists_out = []
raw_rules = []
raw_pages = []          # J165: osiotekstin sivurajat, samat indeksit kuin raw_rules
_SHARED = [None]        # viimeksi nahty FLEET RULES -lohko
_PICKS_OK = [0]         # tarkistettuja pick-osoituksia
_OWN_HITS = [0]         # lauseita joilla on omistajarivi
_OWN_REOWNED = [0]      # hinnoitellun rivin mukaan siirrettyja
_INHERITED = []         # listat jotka perivat sen
stat = collections.Counter()
for Lx in L:
    titles = [s["title"] for s in Lx["sections"]]
    secs = []
    raw_here = []
    pg_here = []
    for si, s in enumerate(Lx["sections"]):
        raw_here.append(" ".join(s["rules"]))
        pg_here.append(s.get("pg") or [])
        rules, text, notes = [], [], []
        for para in s["rules"]:
            m = SECN.match(para)
            if m:
                # koskee yhta skwadronia, ei koko laivastoa -> vain nakyviin
                _head = para.split(".")[0].rstrip()
                # Otsikkorivi paattyy kaksoispisteeseen ("1-2 Kroozers,
                # chosen from the following list:"), ja piste sen peraan
                # antoi ":." Da Ork Clanz -listalla kahdesti.
                text.append(_head if _head.endswith(":") else _head + ".")
            for sent in sentences(para):
                r = detect(sent)
                if not r:
                    if (RULEY.search(sent) and len(sent) < 500) or keep_text(Lx["name"], s["title"], sent):
                        text.append(sent)
                    continue
                # Lause voi olla seka valvottu saanto etta kortin teksti:
                # Farseers s.318 on 0-3-lukumaara JA re-rollin kayttosaanto,
                # joka ilman tata katosi komentajakortilta (pistokoe 7 rivi 76).
                if keep_text(Lx["name"], s["title"], sent):
                    text.append(sent)
                r["src"] = sent
                r["ok"] = not s["title"].startswith("FLEET RULES")
                if r["kind"] == "ratio":
                    a = resolve_sections(r["allow_type"], titles, si)
                    b = resolve_sections(r["per_type"], titles, si)
                    if not a or not b or set(a) & set(b):
                        r["ok"] = False
                    else:
                        r["allow_sec"], r["per_sec"] = a, b
                elif r["kind"] == "cap":
                    a = resolve_sections(r["what"], titles, si)
                    if not a:
                        r["ok"] = False
                    else:
                        r["sec"] = a
                elif r["kind"] == "per_points":
                    a = resolve_sections(r["what"], titles, si)
                    if a:
                        r["sec"] = a
                    else:
                        r["ok"] = False
                elif r["kind"] in ("mandatory_at", "squadron", "section_count"):
                    r["sec"] = [si]
                    if r.get("needs_guard"):
                        # Lauseen on puhuttava tasta osiosta, muuten
                        # osiotason laskenta mittaisi vaaraa asiaa.
                        tt = {w for w in re.findall(r"[a-z]+", s["title"].lower())
                              if len(w) > 3 and w not in ("your", "fleet", "with")}
                        sw = set(re.findall(r"[a-z]+", sent.lower()))
                        if not (tt & sw):
                            r["ok"] = False
                    r.pop("needs_guard", None)
                if r["ok"]:
                    rules.append(r)
                else:
                    text.append(sent)
        # sama saanto voi toistua kappaleessa -> siivoa duplikaatit
        seen, uniq = set(), []
        for r in rules:
            k = json.dumps({x: v for x, v in r.items() if x != "src"}, sort_keys=True)
            if k in seen:
                continue
            seen.add(k)
            uniq.append(r)
        rules = uniq


        text = list(dict.fromkeys(text))
        rules, text = apply_rule_picks(Lx["name"], s["title"], titles,
                                       rules, text)

        # Kokonaan kertomukselliset osiot pois.
        for fx in LORE_SECTIONS:
            if fx["list_has"] in Lx["name"] and s["title"] == fx["sec"]:
                fx["_used"] = fx.get("_used", 0) + 1
                text = []

        # Hintataulukon rivit pois lauseiden alusta.
        text = [x for x in (strip_price_rows(t) for t in text) if x]

        ents = []
        for e in s["entries"]:
            fx = FIXES.get((Lx["name"], e["label"]))
            if fx:
                e = dict(e)
                e.update(fx)
            ents.append(dict(l=e["label"], r=e.get("ref"), p=e.get("pts"),
                         src_page=e.get("src_page"),
                             a=1 if e.get("add") else 0,
                             u=1 if e.get("upgrade") else 0,
                             mx=e.get("max"), nt=e.get("note")))
        # otsikon oma maararaja, esim. "0-12 Cruisers"
        if s.get("hi") is not None:
            if any(k in Lx["name"] for k in HEAD_IS_SQUADRON):
                _HEAD_SQ_USED[0] += 1
                text.append(
                    "There is no restriction for what kinds or how many of what "
                    "type of skwadrons are in the fleet as long as no Warlord may "
                    "have more than one \u2019Uge Ship, which counts as a skwadron "
                    "by itself.")
                notes.append(
                    "Skwadron size, not a fleet total: the book prints "
                    "\u201c%s\u201d as the size of one skwadron (pg. 372)."
                    % (s.get("head", "") or s["title"]))
            else:
                rules.append(dict(kind="section_count", min=s["lo"], max=s["hi"],
                                  src=s.get("head", ""), sec=[si], ok=True, hdr=1))
        # Sama ylaraja seka otsikosta etta leipatekstista antaa kaksi
        # identtista tarkistusriviä. Yhdistetaan: jaljelle jaa
        # osiolaskuri, mutta lahdelauseeksi otetaan kirjan taysi
        # virke, koska se kertoo enemman kuin pelkka otsikko.
        caps = [r for r in rules if r["kind"] == "cap"]
        heads = [r for r in rules if r["kind"] == "section_count"]
        if (len(caps) == 1 and len(heads) == 1
                and caps[0].get("max") == heads[0].get("max")):
            heads[0]["src"] = caps[0].get("src") or heads[0].get("src")
            rules = [r for r in rules if r is not caps[0]]

        for r in rules:
            stat[r["kind"]] += 1
        stat["text"] += len(text)
        apply_entry_adds(Lx["name"], s["title"],
                         " ".join(s["rules"]), ents)
        apply_entry_limits(Lx["name"], s["title"],
                           " ".join(s["rules"]), ents)
        # Kenen rivin kuvaus kukin lause on. Nimi eika indeksi: indeksit
        # siirtyvat kun kaksoiskappaleita karsitaan ja rivaja lisataan.
        own = None
        desc = s.get("desc") or {}
        if desc:
            dkeys = [(lab, _nkey(dt)) for lab, dt in desc.items()]
            own = []
            for t in text:
                k = _nkey(t)
                own.append(next((lab for lab, dt in dkeys
                                 if k and dt and k in dt), None))
            if not any(own):
                own = None
            else:
                _OWN_HITS[0] += sum(1 for x in own if x)
        sec_out = dict(t=s["title"], rules=rules, text=text, notes=notes, ents=ents)
        if own:
            sec_out["own"] = own
        secs.append(sec_out)
    # Sama lause kahdesti samassa listassa. FLEET RULES -lohko poimii koko
    # sivualueen, joten se toistaa sen mika on jo oman otsikkonsa alla -
    # esimerkiksi Tau-listan SQUADRONS-lauseet olivat molemmissa. Tarkempi
    # paikka voittaa, eli kaksoiskappale poistetaan FLEET RULES -lohkosta.
    # own on rinnakkainen textin kanssa, joten kumpikin on karsittava
    # samalla kertaa - muuten omistajat siirtyvat vaarille lauseille.
    def _trim(x, wanted):
        own = x.get("own")
        if own is None:
            x["text"] = wanted
            return
        pairs = [(t, o) for t, o in zip(x["text"], own) if t in wanted]
        x["text"] = [t for t, _ in pairs]
        x["own"] = [o for _, o in pairs]
        if not any(x["own"]):
            x.pop("own", None)

    fr = [i for i, x in enumerate(secs) if x["t"].startswith("FLEET RULES")]
    if fr:
        i = fr[0]
        elsewhere = {t for j, x in enumerate(secs) if j != i for t in x["text"]}
        _trim(secs[i], [t for t in secs[i]["text"] if t not in elsewhere])
    # Loput toistot: sama lause kahdessa muussa osiossa, ensimmainen jaa.
    seen = set()
    for x in secs:
        keep = []
        for t in x["text"]:
            if t in seen:
                continue
            seen.add(t)
            keep.append(t)
        _trim(x, keep)

    # Faktion yhteiset saannot ovat kirjassa kerran, ennen faktion
    # ensimmaista listaa. Seuraavat saman faktion listat jaisivat ilman,
    # vaikka saannot koskevat niita: 20 listaa 32:sta oli ilman. Peritaan
    # lohko edelliselta listalta - listat ovat sivujarjestyksessa ja
    # jokaisen faktion ensimmainen saa oman lohkonsa, joten edellinen on
    # aina samaa faktiota.
    if secs and secs[0]["t"].startswith("FLEET RULES"):
        _SHARED[0] = secs[0]
    elif _SHARED[0] is not None:
        _sh = copy.deepcopy(_SHARED[0])
        # Kohta 8: perinta tuo nakyvan tekstin, ei saantoja. Saannon
        # osioindeksit (pick, unit_pick, up_sec) ovat LAHDELISTAN, ja
        # valvottava saanto kirjataan listakohtaisesti (RULE_PICKS late).
        _sh["rules"] = []
        secs.insert(0, _sh)
        # raws on osioindeksoitu: pidetaan se samanmittaisena. Tyhja
        # alkio, jotta periminen ei lauo yhtaan proosasaantoa uudelleen
        # vaan lisaa pelkastaan nakyvan tekstin.
        raw_here.insert(0, "")
        pg_here.insert(0, [])
        _INHERITED.append(Lx["name"])
        # Osioindeksit siirtyvat yhdella. Kiinnityskohteita (at) ei ole
        # viela laskettu, joten vain saantojen kentat tarvitsevat siirron.
        # HUOM: osioindeksi on myos pick-listojen dictien sisalla, ja
        # niiden unohtaminen rikkoi Bastion Fleetsin taistelulaivasuhteen
        # hiljaa - indeksi osoitti yha olemassa olevaan mutta vaaraan
        # osioon, joten yksikaan tarkistin ei huomauttanut.
        for sec in secs[1:]:
            for r in sec["rules"]:
                for k in ("sec", "allow_sec", "per_sec"):
                    if k in r:
                        r[k] = [i + 1 for i in r[k]]
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        for p in r.get(k) or []:
                            p["sec"] += 1
                if r.get("exempt"):
                    for p in r["exempt"].get("cond_pick") or []:
                        p["sec"] += 1
                # at_least (pistokoe 18, J26): sama sisakkainen pick kuin exempt.
                if r.get("at_least"):
                    for p in r["at_least"].get("cond_pick") or []:
                        p["sec"] += 1

    # Vartija: jokaisen pickin on osoitettava siihen osioon joka
    # RULE_PICKS-taulussa pyydettiin. Ajetaan vasta kun osiolista on
    # lopullinen, eli kaikkien siirtojen jalkeen.
    _titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec["rules"]:
            groups = [(k, r.get(k) or []) for k in list(r) if k == "pick" or k.endswith("_pick")]
            if r.get("exempt"):
                groups.append(("exempt.cond_pick", r["exempt"].get("cond_pick") or []))
            if r.get("at_least"):
                groups.append(("at_least.cond_pick", r["at_least"].get("cond_pick") or []))
            for k, picks in groups:
                for p in picks:
                    want = p.pop("_t", None)
                    if want is None:
                        continue
                    assert _titles[p["sec"]] == want, (
                        "%s / %s: %s osoittaa osioon %r, piti olla %r"
                        % (Lx["name"], sec["t"], k, _titles[p["sec"]], want))
                    _PICKS_OK[0] += 1

    # Osioindeksien nimet talteen nyt, kun taman listan osiot ovat
    # lopullisessa jarjestyksessaan. Myohemmat vaiheet (vieraiden osioiden
    # poisto, myohaiset saantokorjaukset) tarkistetaan naita vasten.
    stamp_section_names(secs, Lx["name"])

    lists_out.append(dict(nm=Lx["name"], pg=Lx["start"], secs=secs))
    raw_rules.append(raw_here)
    raw_pages.append(pg_here)

# ------------------------------------------- sivuviitteiden ristiintarkistus
STOP = {"class", "the", "of", "and", "a", "an", "ship", "vessel", "craft",
        "battleship", "cruiser", "escort", "destroyer", "frigate", "raider",
        "heavy", "light", "grand", "attack", "assault", "gunship", "ramship",
        "carrier", "transport", "star", "starship", "hulk", "rok", "kroozer",
        "battlekroozer", "battlecruiser", "monastery", "defence", "platform"}


def tokens(t):
    # Sulkeissa oleva nimi EI ole poistettavaa: se on juuri se erotteleva osa
    # ("Rapid strike vessel (Sword)", "LAR SHI (HERO) CLASS STARSHIP").
    t = re.sub(r"pg\.\s*\d+", " ", str(t or "")).lower()
    t = re.sub(r"[^a-z0-9' ]", " ", t)
    return {w for w in t.split() if len(w) > 2 and w not in STOP}


by_name = {}
for k, v in ships.items():
    for w in tokens(v["nm"]):
        by_name.setdefault(w, set()).add(k)

def norm_title(name):
    """Nimi vertailumuotoon: vain kirjaimet ja valilyonnit, PTS-hanta pois."""
    t = re.sub(r"[^A-Z ]", " ", str(name or "").upper())
    t = t.split(" PTS")[0]
    return " ".join(t.split())

ref_fixed = ref_flagged = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e["r"]:
                continue
            key = str(e["r"])
            lab = tokens(e["l"])
            cur = tokens(ships[key]["nm"]) if key in ships else None
            if not lab:
                continue
            # Kaksi eri tilannetta. Jos sivulla EI ole profiilia, cur on
            # None ja uudelleenosoitus on paikallaan. Jos sivulla ON
            # profiili mutta sen nimi koostuu pelkista yleissanoista,
            # tokens palauttaa tyhjan joukon eika nimista voi paatella
            # mitaan - silloin kirjan viitetta ei saa muuttaa. Nain kavi
            # riville "Cargo Transport (pg. 85)": sivun 85 profiili on
            # "TRANSPORT", ja koska sana on pysaytyslistalla, rivi
            # osoitettiin sivulle 192 (Armed Cargo Vessel) ja kirjaa
            # syytettiin virheesta.
            if cur is not None and (not cur or (lab & cur)):
                continue                      # nimi ja viite sopivat yhteen
            # Kaytetaan vain niita rivin sanoja jotka ylipaataan esiintyvat
            # jonkin aluksen nimessa; tuntemattomat maareet (esim. "Goff only")
            # eivat saa estaa tunnistusta.
            known = [w for w in lab if w in by_name]
            cand = set.intersection(*[by_name[w] for w in known]) if known else set()
            if len(cand) == 1:
                new_pg = cand.pop()
                # Kaksi eri tilannetta, ja ne on erotettava. Jos viitatulla
                # sivulla ON profiili mutta vaaran aluksen, kirjan viite on
                # oikeasti vaarin. Jos sivulla ei ole profiilia lainkaan,
                # kirja voi olla aivan oikeassa: esimerkiksi Venerable
                # battle barge (s. 102) on saantosivu "PTS: VARY", jonka
                # tilastot riippuvat valitusta rungosta. Silloin kortti
                # kayttaa kirjan omaa esimerkkialusta, eika kirjaa saa
                # syyttaa virheesta.
                if key in ships:
                    # Lippu regressiotestille. Huomautusteksti siivotaan
                    # myohemmin pois, koska kirjan vioista kertominen ei
                    # kuulu pelaajan kortille - korjaus itse jaa voimaan.
                    e["rf"] = 1
                    e["nt"] = ("Source page reference is wrong: the book prints "
                               "pg. %s, but %s is on pg. %s. Corrected by name."
                               % (e["r"], ships[new_pg]["nm"].title(), new_pg))
                else:
                    e["nt"] = ("The book's pg. %s has no stat profile for this "
                               "entry; this card uses %s on pg. %s."
                               % (e["r"], ships[new_pg]["nm"].title(), new_pg))
                e["r"] = int(new_pg)
                ref_fixed += 1
            elif key in ships:
                e["nt"] = ("Source page reference pg. %s points at %s, which does not "
                           "match this entry. Check the book before using this card."
                           % (e["r"], ships[key]["nm"].title()))
                e["badref"] = 1
                ref_flagged += 1

print("sivuviitteita korjattu nimen perusteella: %d, merkitty epailyttavaksi: %d"
      % (ref_fixed, ref_flagged))

# Jaettu profiili, vaara faktio kortilla.
#
# Kirja painaa Chaos-listoilla "Vengeance class grand cruiser (pg. 58)",
# vaikka Chaos-osiossa on sama profiili sivulla 270. Viite on kirjan oma
# ristiviite jaettuun profiiliin, ei painovirhe - mutta kortille se tuottaa
# Chaos-laivastoon alaotsikon "Imperial Navy" ja ohjaa pelaajan vaaraan
# osioon. Osoitetaan oman faktion painokseen, jos ja vain jos profiilit
# ovat identtiset.
FACTION_WORDS = [
    ("CHAOS", "chaos"), ("IMPERIAL NAVY", "imperial navy"),
    ("SPACE MARINE", "space marine"), ("ELDAR", "eldar"), ("DARK ELDAR", "dark eldar"),
    ("ORK", "ork"), ("TAU", "tau"), ("NECRON", "necron"), ("TYRANID", "tyranid"),
    ("ADEPTUS MECHANICUS", "adeptus mechanicus"), ("ROGUE TRADER", "rogue trader"),
    ("INQUISITION", "inquisition"),
]


def _fleet_match(profile_fleet, list_name):
    """Osuuko profiilin faktio listan nimeen."""
    fl = str(profile_fleet or "").upper()
    ln = str(list_name or "").lower()
    return any(pat in fl and word in ln for pat, word in FACTION_WORDS)


def _profile_key(sh):
    """Tunniste jolla kaksi profiilia ovat sama alus: tilastot ja aseistus."""
    return (sh.get("sp"), sh.get("tn"), sh.get("sh"), sh.get("ar"),
            sh.get("tu"), sh.get("hp"),
            tuple(tuple(a) for a in (sh.get("aw") or [])))


_by_title = {}
for _pg, _sh in ships.items():
    _by_title.setdefault(norm_title(_sh.get("nm")), []).append(_pg)

faction_repointed = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e.get("r"):
                continue
            cur = ships.get(str(e["r"]))
            if not cur or _fleet_match(cur.get("fl"), Lx["nm"]):
                continue
            twins = [p for p in _by_title.get(norm_title(cur.get("nm")), [])
                     if p != str(e["r"])
                     and _fleet_match(ships[p].get("fl"), Lx["nm"])
                     and _profile_key(ships[p]) == _profile_key(cur)]
            if len(twins) != 1:
                continue
            new_pg = twins[0]
            e["nt"] = ("The book cross-references the %s printing on pg. %s; this is "
                       "the identical %s printing on pg. %s."
                       % (str(cur.get("fl") or "").title(), e["r"],
                          str(ships[new_pg].get("fl") or "").title(), new_pg))
            e["r"] = int(new_pg)
            faction_repointed += 1

print("oman faktion painokseen osoitettu: %d" % faction_repointed)

# Lisaa Tau-konfiguraatiot vasta sivuviitteiden nimitarkistuksen jalkeen:
# muuten saman rungon useat nimet tekisivat kirjan virheellisten viitteiden
# automaattisesta korjauksesta tarkoituksella monitulkintaisen.
for base, variants in TAU_CONFIGS.items():
    if base not in ships:
        continue
    original = ships[base]
    root_name = original["nm"]
    for spec in variants:
        key, label = spec[0], spec[1]
        if key == base:
            target = original
        else:
            target = copy.deepcopy(original)
            ships[key] = target
        target["nm"] = "%s — %s CONFIGURATION" % (root_name, label.upper())
        if len(spec) > 2:
            target["aw"] = spec[2]
        if key == "472c":
            target["pg"] = 473

# Yksi geneerinen listarivi muuttuu valittaviksi konfiguraatioiksi. Hinta ja
# kaikki listan osio-/maarasaannot sailyvat samoina jokaiselle vaihtoehdolle.
for Lx in lists_out:
    for sec in Lx["secs"]:
        expanded = []
        for e in sec["ents"]:
            variants = TAU_CONFIGS.get(str(e.get("r")))
            if not variants:
                expanded.append(e)
                continue
            for spec in variants:
                ne = copy.deepcopy(e)
                ne["r"] = int(spec[0]) if spec[0].isdigit() else spec[0]
                ne["l"] = "%s — %s configuration" % (e["l"], spec[1])
                expanded.append(ne)
        sec["ents"] = expanded

# Xenos Vesselin variantit samalle riville. Tehdaan Taun jalkeen ja samalla
# kuviolla: hinta ja osion maarasaannot sailyvat jokaisella vaihtoehdolla.
_xenos_base = XENOS_VARIANTS.get("184", [])
if _xenos_base:
    _sr = (ships.get("184") or {}).get("sr") or ""
    assert XENOS_SOURCE in _sr, (
        "Xenos-varianttien lahdelause ei loydy sivun 184 SPECIAL-lohkosta - "
        "laajennusta ei tehda arvaamalla")
    for _key, _label in _xenos_base:
        assert _key in ships, "Xenos-variantti %s puuttuu profiileista" % _key
        assert ships[_key].get("bp") == ships["184"].get("bp"), (
            "Xenos-variantti %s ei maksa samaa kuin geneerinen" % _key)

xenos_rows = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        expanded = []
        for e in sec["ents"]:
            variants = XENOS_VARIANTS.get(str(e.get("r")))
            if not variants:
                expanded.append(e)
                continue
            for key, label in variants:
                ne = copy.deepcopy(e)
                ne["r"] = int(key)
                if label:
                    ne["l"] = "%s - %s" % (e["l"], label)
                    ne["nt"] = ("Named Xenos Vessel variant from pg. %s: same 50 "
                                "points, with one xenotech system already chosen."
                                % key)
                    xenos_rows += 1
                expanded.append(ne)
        sec["ents"] = expanded

print("Xenos-varianttirivaja lisatty: %d" % xenos_rows)

# Aseiden vaihto-optiot aseistustaulukon riveiksi.
sw_ok, sw_skip = swaps.annotate(ships)
print("asevaihtoja jasennetty: %d, tekstiksi jatetty: %d"
      % (len(sw_ok), len(sw_skip)))
for pg, nm, t, why in sw_skip:
    print("   jaa tekstiksi: pg. %s %s (%s)" % (pg, nm.title(), why))

# Sivuviite ilman alusprofiilia ei ole alusrivi.
#
# "Auxiliary vessels (pg. 191)" ja "Ghostship (pg. 306)" osoittavat
# saantosivuihin, eivat profiileihin: edellinen kertoo etta liittolais-
# laivastosta saa poimia escortteja, jalkimmainen Eldarin haamulaivoista.
# Viite nollataan ennen luokittelua, jotta niista tulee laivastopaivityksia
# eika ostettavia aluksia - muuten sovellus tarjoaisi rivin josta ei synny
# korttia lainkaan.
noprofile = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e.get("r") or str(e["r"]) in ships:
                continue
            e["nt"] = ((e.get("nt") + " ") if e.get("nt") else "") + (
                "The book points at pg. %s, which is a rules page rather than "
                "a ship profile." % e["r"])
            e["r"] = None
            noprofile += 1

print("profiilittomia viitteita nollattu: %d" % noprofile)

# Rivien luokittelu yksikoihin ja paivityksiin, ja kirjan leipatekstiin
# jaaneiden hinnoiteltujen paivitysten lisays valittaviksi riveiksi.
up_added, up_skipped, up_warn = upgrades.annotate(lists_out, raw_rules, raw_pages)

print("paivitysrivaja lisatty proosasta: %d, lahdelause ei tasmannut: %d"
      % (up_added, up_skipped))
for w in up_warn:
    print("   VAROITUS:", w)

# Kuratoidut ehdot listariveille, joita kirja rajaa mutta joilla ei ole
# lahdelausetta upgrades.py:n EXTRA-taulussa. Tasan yksi osuma per rivi.
UP_CONDS = [
    # s.307: "Ghostships may not be armed with launch bays", "may not contain
    # Aspect Warrior fighting crews"; s.318 "Any capital ship ... may be
    # upgraded to a Ghostship". Bayt tarjolla = bayt aseistuksessa.
    ("Eldar — Iyanden Craftworld", "Ghostship",
     dict(cap=1, no=r"launch bay", noup=r"aspect warrior host")),
    # s.318 "Any capital ship in the fleet may be equipped with Aspect
    # Warriors"; s.307 ei Ghostshipille.
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host",
     # s.329: Flame of Asuryanin miehisto "count as an Aspect Warrior
     # fighting crew" jo hinnassa (pistokoe 12 rivi 34).
     dict(cap=1, noup=r"^ghostship", nmno=r"^flame of asuryan")),
]
for _ln, _lab, _cond in UP_CONDS:
    _hits = [e for L in lists_out if L["nm"] == _ln
             for s in L["secs"] for e in s["ents"] if e.get("k") == "up" and e["l"] == _lab]
    assert len(_hits) == 1, "UP_CONDS: %s / %s osui %d kertaa" % (_ln, _lab, len(_hits))
    _hits[0]["cond"] = dict(_hits[0].get("cond") or {}, **_cond)

# "Auxiliary vessels (pg. 191) ... varies" on listasaanto (puolet escorteista
# saattamansa laivaston listalta), ei escortille ostettava 0 pts -paivitys.
# Rivi on osionsa viimeinen, joten muiden rivien at-viitteet eivat siirry.
# Pistokoe 4 (10.9.2026), rivit 13/27.
_aux = 0
for L in lists_out:
    for s in L["secs"]:
        for _i, e in enumerate(s["ents"]):
            if e.get("k") == "up" and e["l"] == "Auxiliary vessels":
                assert _i == len(s["ents"]) - 1, "Auxiliary vessels ei ole osion viimeinen rivi: %s" % L["nm"]
                s["ents"].pop()
                _aux += 1
                break
assert _aux == 2, "Auxiliary vessels -riveja odotettiin 2, poistettiin %d" % _aux

# s.227: "Any Daemon ship may have a single Mark of Chaos with the same
# effects and cost in points as described on pg. 232." Black Crusade -listan
# DAEMON SHIPS -osio ei toista lausetta, joten rivit lisataan kasin s.232:n
# hinnoin; ehto: Daemon ship otettu. Nurglen Mark +1 Damage Point (s.232).
# Pistokoe 5, rivi 43.
_BC_MARKS = [("The Mark of Slaanesh", 25, {}), ("The Mark of Khorne", 20, {}),
             ("The Mark of Tzeentch", 30, {}), ("The Mark of Nurgle", 35, dict(mod=dict(hp=1)))]
_bc = [L for L in lists_out if L["nm"] == "Chaos — Black Crusade"]
assert len(_bc) == 1, "Black Crusade -lista ei loydy"
_bcsec = [s for s in _bc[0]["secs"] if s["t"].strip().upper() == "DAEMON SHIPS"]
assert len(_bcsec) == 1, "Black Crusade: DAEMON SHIPS -osio ei loydy tasan kerran"
for _lab, _p, _extra in _BC_MARKS:
    assert not any(e["l"] == _lab for e in _bcsec[0]["ents"]), "Black Crusade DAEMON SHIPS: %s on jo" % _lab
    _bcsec[0]["ents"].append(dict(dict(l=_lab, r=None, p=_p, a=1, u=1, mx=None, k="up", grp="mark",
                                       src_page=227, cond=dict(cap=1, up=r"^daemonship:"),
                                       nt="Fleets pg. 227: any Daemon ship may have a single Mark of Chaos "
                                          "at the cost on pg. 232."), **_extra))

# s.234: "Remember, a ship with a Chaos Space Marine crew may have a Mark of
# Chaos, even if a Warmaster or Lord does not captain it, but is subject to the
# restriction on pg. 225." Listan miehistolla ei ole nimettya legioonaa, joten
# s.225:n Black Legion -rivi ("May have any one Mark"); hinnat s.234:n Markeista.
# Pistokoe 11, rivit 15 ja 88.
_BC_CREW_MARKS = [("The Mark of Slaanesh", 25, {}), ("The Mark of Khorne", 20, {}),
                  ("The Mark of Tzeentch", 25, {}), ("The Mark of Nurgle", 35, dict(mod=dict(hp=1)))]
_bccrew = [s for s in _bc[0]["secs"] if s["t"].strip().upper() == "CHAOS SPACE MARINE CREWS"]
assert len(_bccrew) == 1, "Black Crusade: CHAOS SPACE MARINE CREWS -osio ei loydy tasan kerran"
for _lab, _p, _extra in _BC_CREW_MARKS:
    assert not any(e["l"] == _lab for e in _bccrew[0]["ents"]), "Black Crusade CSM CREWS: %s on jo" % _lab
    _bccrew[0]["ents"].append(dict(dict(l=_lab, r=None, p=_p, a=1, u=1, mx=None, k="up", grp="crewmark",
                                        src_page=234, cond=dict(cap=1, up=r"^chaos space marine crew$"),
                                        nt="Fleets pg. 234: a ship with a Chaos Space Marine crew may have "
                                           "one Mark of Chaos, subject to its Legion (pg. 225)."), **_extra))

# Komentajakortin osiotekstista pois kertomus- ja skenaariolauseet, jotka
# RULEY paastaa lapi ("must", "only"). Lause poistetaan tekstista ja
# omistajataulusta samasta kohdasta. Tasan yksi osuma per lause.
DROP_LIST_TEXT = [
    # s.140: Istvaanistit ja Xeno Hybristit ovat kertomusta.
    ("The Emperor's Inquisition", "ORDO XENOS INQUISITORS", "While Inquisitors of this Ordo know they must be fully cognizant"),
    # s.141: milloin inkvisiittori kutsutaan on kertomusta; sita seuraava
    # "The enemy Xenos fleet adds D6x50 points" on saanto ja jaa.
    ("The Emperor's Inquisition", "ORDO XENOS INQUISITORS", "An Ordo Xenos Inquisitor will only be called when"),
]
for _ln, _st, _frag in DROP_LIST_TEXT:
    _secs = [s for L in lists_out if L["nm"] == _ln for s in L["secs"] if s["t"].strip() == _st]
    assert len(_secs) == 1, "DROP_LIST_TEXT: osio %s / %s osui %d kertaa" % (_ln, _st, len(_secs))
    _s = _secs[0]
    _idx = [i for i, t in enumerate(_s.get("text") or []) if t.startswith(_frag)]
    assert len(_idx) == 1, "DROP_LIST_TEXT: lause %r osui %d kertaa" % (_frag, len(_idx))
    _i = _idx[0]
    del _s["text"][_i]
    if _s.get("own") and len(_s["own"]) > _i:
        del _s["own"][_i]
    if _s.get("ownx"):
        _s["ownx"] = [j - 1 if j > _i else j for j in _s["ownx"] if j != _i]

# Listarivin huomautus kertoo saannon, ei kirjan vikoja. Kaksi
# muunnosta, molemmat pakko osua vahintaan kerran.
NOTE_DROP = [
    r"^Source misprint:",
    r"^Source page reference is wrong:",
    r"^The book's pg\. \d+ has no stat profile for this entry;",
    r"^The book's price on pg\. \d+ is unreadable",
    r"^The book points at pg\. \d+, which is a rules page",
    r"^The book cross-references the Imperial Navy printing on pg\.",
]
# "... : \u201close sentence\u201d" -> pelkka lause
NOTE_UNWRAP = [
    r"The book prints this only in the section text:\s*",
    r"The book states this in the shared fleet rules:\s*",
]
_NOTE_HITS = collections.Counter()
_NOTE_DEDUPED = [0]


def clean_note(nt, shown):
    """shown = listalla jo nakyvien lauseiden vertailumuodot."""
    if not nt:
        return nt
    t = nt.strip()
    for rx in NOTE_DROP:
        if re.search(rx, t):
            _NOTE_HITS[rx] += 1
            return None
    for rx in NOTE_UNWRAP:
        m = re.search(rx, t)
        if not m:
            continue
        _NOTE_HITS[rx] += 1
        head = t[:m.start()].strip()
        rest = t[m.end():].strip()
        # Kirjan lause on lainausmerkeissa; kuoritaan ne pois.
        if rest.startswith("\u201c") and rest.endswith("\u201d"):
            rest = rest[1:-1].strip()
        rest = re.sub(r"\s*\.{3,}\s*", " ", rest).strip()
        # Lainattu lause pudotetaan jos se nakyy jo listan tekstissa:
        # muuten sama sisalto olisi kahdesti perakkain.
        if rest and _nkey(rest) in shown:
            _NOTE_DEDUPED[0] += 1
            rest = ""
        t = (head + " " + rest).strip() if head else rest
        break
    t = re.sub(r"\s*\.{3,}\s*", " ", t).strip()
    if t and _nkey(t) in shown:
        _NOTE_DEDUPED[0] += 1
        return None
    return t or None


for Lx in lists_out:
    shown = set()
    for sec in Lx["secs"]:
        for x in sec["text"]:
            k = _nkey(x)
            if k:
                shown.add(k)
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if e.get("nt"):
                e["nt"] = clean_note(e["nt"], shown)

_missing = [rx for rx in NOTE_DROP + NOTE_UNWRAP if not _NOTE_HITS[rx]]
assert not _missing, "huomautuskaava ei osunut kertaakaan: %s" % _missing
print("huomautuksia siivottu: %d poistettu, %d kuorittu, %d toistoa pois"
      % (sum(_NOTE_HITS[rx] for rx in NOTE_DROP),
         sum(_NOTE_HITS[rx] for rx in NOTE_UNWRAP), _NOTE_DEDUPED[0]))

# Lause joka ALKAA hinnoitellulla rivilla kuuluu SILLE riville, ei
# edelliselle. Kirjan sivulla rivi on otsikko sita seuraavalle
# kuvaukselle; jos rivi jai leipatekstiin, omistajuus meni edelliselle.
# Nain kavi Grey Knightsin FLEET COMMANDER -osiossa: kalliimman
# komentajan boarding- ja hit-and-run-bonukset paatyivat halvemman
# komentajan kortille. Ajetaan vasta nyt, koska osa riveista syntyy
# proosapoiminnassa.
PRICE_HEAD = re.compile(r"^\s*(.{3,60}?)\s*\.{2,}\s*\+?[\d,]+\s*"
                        r"(?:pts|points)\b")
for Lx in lists_out:
    for sec in Lx["secs"]:
        own = sec.get("own")
        if not own:
            continue
        labels = [str(e.get("l") or "") for e in sec["ents"]]
        for i, t in enumerate(sec["text"]):
            m = PRICE_HEAD.match(t)
            if not m:
                continue
            hit = next((lab for lab in labels
                        if lab and _nkey(lab) == _nkey(m.group(1))), None)
            if not hit or own[i] == hit:
                continue
            was = own[i]
            ownx = sec.setdefault("ownx", [])
            for j in range(i, len(own)):
                if own[j] != was:
                    break
                own[j] = hit
                ownx.append(j)
                _OWN_REOWNED[0] += 1

print("omistajuus siirretty hinnoitellun rivin mukaan: %d lausetta"
      % _OWN_REOWNED[0])

# Vieraat osiot pois. Tama on viimeinen vaihe, koska Clanz-listan
# Gubbins- ja klaanirivit luetaan juuri naista Waaagh!-listan osioista.
for Lx in lists_out:
    keep = []
    for sec in Lx["secs"]:
        drop = next((fx for fx in DROP_SECS
                     if fx["list_has"] in Lx["nm"] and sec["t"] == fx["sec"]), None)
        if drop:
            drop["_used"] = drop.get("_used", 0) + 1
            continue
        keep.append(sec)
    Lx["secs"] = keep

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in DROP_SECS if fx.get("_used") != 1]
assert not _unused, "vieraan osion poisto ei osunut tasan kerran: %s" % _unused
print("vieraita osioita poistettu: %d" % len(DROP_SECS))

# Poisto siirtaa kaikkia sen jalkeisia osioindekseja. Tarkistetaan heti.
check_section_names(lists_out, "osionpoiston jalkeen", stamp_new=False)

assert _INHERITED, "yksikaan lista ei perinyt faktion yhteisia saantoja"
print("faktion yhteiset saannot peritty %d listalle" % len(_INHERITED))

    # Kohta 8: myohaiset saantokorjaukset. Lause on voinut tulla osioon vasta
    # faktion yhteisten saantojen perintana (Tyranids Hive Fleet), joten se
    # etsitaan lopullisesta osiotekstista.
for Lx in lists_out:
    secs = Lx["secs"]
    _ftitles = [x["t"] for x in secs]
    for fx in RULE_PICKS:
        if fx["list_has"] not in Lx["nm"] or not fx.get("late"):
            continue
        _sec = [x for x in secs if x["t"].strip().lower() == fx["sec"].strip().lower()]
        assert len(_sec) == 1, "%s: myohainen osio %r ei loydy tasan kerran" % (Lx["nm"], fx["sec"])
        _sec = _sec[0]
        _hit = [t for t in _sec["text"] if fx["from_text"] in t]
        assert len(_hit) == 1, ("%s / %s: myohainen tekstilause %r osui %d kertaan"
                                % (Lx["nm"], fx["sec"], fx["from_text"], len(_hit)))
        if not fx.get("keep_text"):
            _sec["text"] = [t for t in _sec["text"] if t not in _hit]
            if _sec.get("own"):
                _sec["own"] = [o for t, o in zip(_sec["text"] + _hit, _sec["own"]) if t not in _hit] if len(_sec["own"]) == len(_sec["text"]) + len(_hit) else _sec["own"]
        _where = "%s / %s (late)" % (Lx["nm"], fx["sec"])
        for rule in (fx.get("rules") or [fx["rule"]]):
            r = dict(rule, src=fx["src"], ok=True)
            for k in list(r):
                if k == "pick" or k.endswith("_pick"):
                    r[k] = [dict((kk, vv) for kk, vv in q.items() if kk != "_t")
                            for q in pick_secs(r[k], _ftitles, _where)]
            if "exempt" in r and "cond_pick" in r["exempt"]:
                r["exempt"] = dict(r["exempt"], cond_pick=[dict((kk, vv) for kk, vv in q.items() if kk != "_t")
                                                            for q in pick_secs(r["exempt"]["cond_pick"], _ftitles, _where)])
            if "allow_pick" not in r and "sec" not in r:
                r["sec"] = [secs.index(_sec)]
            _sec["rules"].append(r)
        fx["_used"] = fx.get("_used", 0) + 1

# Kohta 8: paivitysosion nimi -> indeksi vasta nyt, kun annotate on luonut
# osiot (Tyranidien BIO-ENHANCEMENTS). Otsikon on loydyttava tasan kerran.
_UP_SEC_OK = 0
for _L in lists_out:
    _tt = [x["t"].strip().lower() for x in _L["secs"]]
    for _sec in _L["secs"]:
        for _r in _sec.get("rules") or []:
            if isinstance(_r.get("up_sec"), str):
                _idx = [i for i, t in enumerate(_tt) if t == _r["up_sec"].strip().lower()]
                assert len(_idx) == 1, "%s: paivitysosiota %r ei loydy tasan kerran (osiot: %s)" % (_L["nm"], _r["up_sec"], _tt)
                _r["up_sec"] = _idx[0]
                _UP_SEC_OK += 1
print("paivitysosioihin sidottuja saantoja: %d" % _UP_SEC_OK)


assert _HEAD_SQ_USED[0] >= 1, \
    "skwadronikokoinen otsikko ei osunut kertaakaan: %s" % HEAD_IS_SQUADRON
print("otsikkolukuja luettu skwadronin kooksi: %d" % _HEAD_SQ_USED[0])

assert upgrades._SEC_GROUP_HITS[0] >= 1,     "osiokohtainen poissulkeva ryhma ei osunut kertaakaan"
print("osiokohtaisia poissulkevia rivaja: %d" % upgrades._SEC_GROUP_HITS[0])

assert upgrades._ONE_WEAPON_HITS[0] >= 1, \
    "yhden aseen ryhma ei osunut kertaakaan"
print("yhden aseen valintoja ryhmitelty: %d" % upgrades._ONE_WEAPON_HITS[0])

assert upgrades._HULL_PRICE_HITS[0] >= 1, \
    "alusluokkahinnasto ei osunut kertaakaan"
print("alusluokkahinnaston rivaja kiinnitetty: %d" % upgrades._HULL_PRICE_HITS[0])
# Nurgle (4 luokkaa), Khorne (3) ja Slaanesh (4): "must take the Mark of X,
# which is already included in the cost" (s.241, 245, 249). Tzeentch ja
# Black Crusade eivat sisallyta Markia.
print("listapaivitysten vaikutuksia: %d, saattajaversioita: %d" % (len(upgrades._ROW_EFFECT_LOG), upgrades._ESC_SPLIT_HITS[0]))
assert upgrades._ESC_SPLIT_HITS[0] == 3, "saattajaversioita odotettiin 3"
assert upgrades._DEATHSKULLZ_HITS[0] == 5, "Deathskullz-kopioita odotettiin 5, loytyi %d" % upgrades._DEATHSKULLZ_HITS[0]
assert upgrades._BIO_EACH_HITS[0] == 8, "bio-kerrannaisia odotettiin 8, loytyi %d" % upgrades._BIO_EACH_HITS[0]
assert upgrades._ROW_COND_HITS[0] == 20, "ROW_CONDS-osumia odotettiin 20, loytyi %d: %r" % (upgrades._ROW_COND_HITS[0], upgrades._ROW_COND_LOG)
assert upgrades._HULK_GUBBIN_HITS[0] == 13, "hulkin Gubbins-kopioita odotettiin 13, loytyi %d" % upgrades._HULK_GUBBIN_HITS[0]
assert upgrades._HULK_PF_HITS[0] == 1, "Waaagh!-hulkin Extra Power Fields -riveja odotettiin 1, loytyi %d" % upgrades._HULK_PF_HITS[0]
assert upgrades._MULTI_MARK_HITS[0] == 4, "Incursion-Warmasterin Mark-riveja odotettiin 4, loytyi %d" % upgrades._MULTI_MARK_HITS[0]
assert upgrades._MARK_INC_HITS[0] == 11, \
    "Daemonship-riveja joilla Mark sisaltyy odotettiin 11, loytyi %d" % upgrades._MARK_INC_HITS[0]

# Jokaisen kasin kirjoitetun saantokorjauksen on osuttava tasan kerran.
# Jos lahdeteksti muuttuu, korjaus lakkaa osumasta hiljaa - ja silloin
# virheellinen tarkistus palaisi huomaamatta.
_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in RULE_PICKS if fx.get("_used") != 1]
assert not _unused, "saantokorjaus ei osunut tasan kerran: %s" % _unused
print("saantokorjauksia sovellettu: %d" % len(RULE_PICKS))
print("pick-osoituksia tarkistettu: %d" % _PICKS_OK[0])
assert _OWN_HITS[0] >= 1, "yhtaan lausetta ei sidottu riviin"
print("lauseita sidottu listariviin: %d" % _OWN_HITS[0])

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in ENTRY_ADDS if fx.get("_used") != 1]
assert not _unused, "listarivin lisays ei osunut tasan kerran: %s" % _unused
print("kasin lisattyja listarivaja: %d" % len(ENTRY_ADDS))

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in ENTRY_LIMITS if fx.get("_used") != 1]
assert not _unused, "rivin maararaja ei osunut tasan kerran: %s" % _unused
print("kasin asetettuja rivirajoja: %d" % len(ENTRY_LIMITS))

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in LORE_SECTIONS if fx.get("_used") != 1]
assert not _unused, "lore-osio ei osunut tasan kerran: %s" % _unused
print("kertomusosioita poistettu: %d" % len(LORE_SECTIONS))

# Optioiden vaikutukset dataan.
for _pg, _sh in ships.items():
    for _o in _sh.get("ol") or []:
        for (_p, _frag), _eff in OPT_EFFECTS.items():
            if str(_p) != str(_pg) or _frag not in _o.get("t", ""):
                continue
            _o.update(copy.deepcopy(_eff))
            _OPT_EFFECT_HITS[(_p, _frag)] = _OPT_EFFECT_HITS.get((_p, _frag), 0) + 1
_miss = [k for k in OPT_EFFECTS if _OPT_EFFECT_HITS.get(k) != 1]
assert not _miss, "optiovaikutus ei osunut tasan kerran: %s" % _miss
print("optiovaikutuksia liitetty: %d" % len(OPT_EFFECTS))
assert _TURNS_FIXED[0] == 1, "TURNS ilman astemerkkia: %d (odotettu 1, s.181)" % _TURNS_FIXED[0]

# --- P1-4: Venerable battle barge = pohjarungon valinta (Fleets s.102) -----
# "chosen from any available Imperial or Chaos battleship, grand cruiser,
# battlecruiser or heavy cruiser at the listed cost, plus an additional
# +35 points for its Space Marine crew." Rivi saa lipun ja runkolistan;
# oletusrunko pysyy s.103 (Seditio Opprimere), jotta vanha tallenne aukeaa.
_HULL_SECS = re.compile(r"battleship|grand cruiser|battlecruiser|heavy cruiser", re.I)
_hull_pages = set()
for _L in lists_out:
    if not re.match(r"Imperial Navy|Chaos", _L["nm"]):
        continue
    for _sec in _L["secs"]:
        if not _HULL_SECS.search(_sec["t"]):
            continue
        for _e in _sec.get("ents") or []:
            _sh = ships.get(str(_e.get("r"))) if _e.get("k") == "unit" else None
            if not _sh or _sh.get("fl") not in ("IMPERIAL NAVY", "CHAOS"):
                continue
            if "," in _sh.get("nm", ""):          # nimetty yksilo, ei luokka
                continue
            _hull_pages.add(str(_e["r"]))
_hull_pages.add("103")                             # Seditio Opprimere itse
HULL_CHOICES = sorted(_hull_pages, key=lambda k: int(re.match(r"\d+", k).group()))
_hc_hits = 0
for _L in lists_out:
    if "Space Marines" not in _L["nm"]:
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if str(_e.get("l", "")).strip().lower() == "venerable battle barge":
                _e["hc"] = 1
                _e["hcp"] = 35
                _e["hulls"] = HULL_CHOICES
                _hc_hits += 1
assert _hc_hits == 3, "Venerable battle barge -riveja odotettiin 3, loytyi %d" % _hc_hits
assert 20 <= len(HULL_CHOICES) <= 32, "runkovaihtoehtoja %d - tarkista rajaus" % len(HULL_CHOICES)
print("venerable-runkovaihtoehtoja: %d" % len(HULL_CHOICES))

# --- kohta 7, era 7: Lite Kroozer s.383 - yksi optio, kaksi vaihtoehtoa -----
# "For no change in cost, they may exchange their prow heavy gunz for a
# torpedo launcha (Speed 30 cm, Strength D6) or additional D6 gunz (for
# D6+2 in total)." Kaksi toisensa poissulkevaa vaihtoa yhdessa lauseessa;
# swaps.py ei jasenna "or"-rakennetta. Jaetaan kahdeksi optioksi samaan
# ryhmaan (gmax 1). Rynnakkotorpedot (dep=0) viittaavat yha launchaan,
# joka pysyy indeksissa 0.
if "383" in ships:
    _lk = ships["383"]
    _prow = [i for i, a in enumerate(_lk["aw"]) if a[0].lower() == "prow heavy gunz"]
    assert len(_prow) == 1, "Lite Kroozer: prow heavy gunz -rivia ei loydy yksiselitteisesti"
    assert _lk["ol"] and _lk["ol"][0]["t"].startswith("Ork Lite Kroozers are essentially"), \
        "Lite Kroozer: optio 0 ei ole odotettu keulavaihto"
    _rest = _lk["ol"][1:]
    _lk["ol"] = [
        dict(t="Prow — torpedo launcha instead of heavy gunz (Speed 30 cm, Strength D6)",
             c=0, var=0, grp="lite_prow", gmax=1,
             sw=dict(f=_prow, t=[["Prow torpedo launcha", "30 cm", "D6", "Front"]])),
        # "additional D6 gunz (for D6+2 in total)": heavy gunz vaihdetaan
        # pois ja keulan gunz (30 cm, 2) saa lisaksi D6 = D6+2. Aiemmin
        # heavy gunz -rivi muutettiin D6+2:ksi ja keulagunzit jaivat 2:een
        # (pistokoe 5, 10.9.2026, rivi 4).
        # Mallinnus: heavy gunz -paikkaan tulee "Prow gunz D6+2" (sw, jotta
        # ryhmalla on tasan yksi voimassa oleva rivi) ja alkuperainen
        # "Prow gunz 2" -rivi poistuu (del ei koske option omaa vaihtorivia).
        dict(**{"t": "Prow — additional D6 gunz (D6+2 in total)",
                "c": 0, "var": 0, "grp": "lite_prow", "gmax": 1,
                "sw": dict(f=_prow, t=[["Prow gunz", "30 cm", "D6+2", "Front"]]),
                "del": r"^prow gunz$"}),
    ] + _rest
    for _o in _rest:
        if _o.get("dep") == 0:
            pass                                   # launcha pysyy indeksissa 0
    print("Lite Kroozer: keulavaihto jaettu kahdeksi optioksi")

# --- kohta 7, era 7: RT Exploration s.180 - "no special variants" ----------
# "Chaos vessels used as loyalist ships must be painted as such, and no
# special variants in the notes of these ships' profiles can be used. For
# example, the Tyrant can't take boosted batteries or a Nova Cannon, etc."
# Listalla on jo omat rivit Lunar/Tyrant/Carnage/Murder hintoineen ("as
# reflected in the fleet list"); rivi saa lipun noopt, ja sovellus pitaa
# aluksen omat optiot pois.
_noopt_hits = 0
for _L in lists_out:
    if _L["nm"] != "Rogue Traders — Exploration":
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "unit" and str(_e.get("r")) in ("71", "69", "277", "279"):
                _e["noopt"] = 1
                _noopt_hits += 1
assert _noopt_hits == 4, "RT Exploration: noopt-riveja odotettiin 4, loytyi %d" % _noopt_hits

# --- Pistokoe 18 (kirjainventaario): kirjan ostettavat, jotka puuttuivat ---
def _text_key(t):
    """Vertailumuoto osion tekstirivelle. Sama lause voi tulla kahdesta
    lahteesta eri asussa: PDF-poiminta antaa kaarevat lainausmerkit ja
    "ie", kasin kirjoitettu kuratointi suorat merkit ja "i.e.". Ilman
    normalisointia ne nayttavat eri lauseilta ja molemmat jaavat osioon."""
    t = (t or "").lower()
    for a, b in ((u"\u2018", "'"), (u"\u2019", "'"), (u"\u201c", '"'),
                 (u"\u201d", '"'), (u"\u2013", "-"), (u"\u2014", "-"),
                 (u"\u2022", " ")):
        t = t.replace(a, b)
    t = t.replace("i.e.", "ie").replace("e.g.", "eg").replace("pg.", "pg")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def add_text(sec, sentences):
    """Lisaa osioon vain ne lauseet, joita siella ei jo ole - myoskaan
    toisen lauseen sisalla (kirjan bullet-lista ja sita seuraava virke
    tulevat poiminnasta usein yhtena rivina)."""
    have = [_text_key(x) for x in (sec.get("text") or [])]
    out = list(sec.get("text") or [])
    for t in sentences:
        k = _text_key(t)
        if not k or any(k == h or (len(k) >= 40 and k in h) for h in have):
            continue
        out.append(t)
        have.append(k)
    sec["text"] = out
    return sec


def _p18_list(nm):
    _h = [x for x in lists_out if x["nm"] == nm]
    assert len(_h) == 1, "lista %r ei loydy tasan kerran" % nm
    return _h[0]


def _p18_sec(L, title):
    _h = [i for i, x in enumerate(L["secs"]) if x["t"].strip().lower() == title.strip().lower()]
    assert len(_h) == 1, "%s: osio %r ei loydy tasan kerran" % (L["nm"], title)
    return _h[0]


def _p18_unit(label, ref, pts, page, mx=None, noopt=False, nt=None):
    assert str(ref) in ships, "alus %r puuttuu" % ref
    e = dict(l=label, r=int(ref), p=pts, src_page=page, a=0, mx=mx, nt=nt, k="unit")
    if noopt:
        e["noopt"] = 1
    return e


# J30 s.178: "A human pirate fleet may have up to one cruiser for every 500
# points of ships in the fleet or portion thereof. A Pirate Cruiser may consist
# of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos fleet
# lists worth 185 points or less. It may also include a single Space Marine
# strike cruiser! Special variants, refits and Nova Cannons cannot be used."
# Hinnat profiilisivuilta; Bakkan muunnelmat ovat "special variants" eivatka
# kuulu mukaan. noopt = aluksen omat optiot (Nova Cannon, varianttivaihdot) pois.
_PIR_SRC = ("A Pirate Cruiser may consist of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos "
            "fleet lists worth 185 points or less. It may also include a single Space Marine strike cruiser! "
            "Special variants, refits and Nova Cannons cannot be used.")
_PIR_CRUISERS = [("Rogue Trader cruiser", 180, 185), ("Tyrant class cruiser", 69, 185),
                 ("Gothic class cruiser", 70, 180), ("Lunar class cruiser", 71, 180),
                 ("Endeavour class light cruiser", 72, 110), ("Endurance class light cruiser", 74, 110),
                 ("Defiant class light cruiser", 76, 120), ("Dauntless class light cruiser", 77, 110),
                 ("Carnage class cruiser", 277, 180), ("Inferno class cruiser", 278, 180),
                 ("Murder class cruiser", 279, 170), ("Slaughter class cruiser", 280, 165)]
_PL = _p18_list("Rogue Traders \u2014 Pirates and Wolf Packs")
_pc = _p18_sec(_PL, "CAPITAL SHIPS")
_pe = _p18_sec(_PL, "ESCORTS")
_pn = _p18_sec(_PL, "NOTES FROM NATE MONTES")
assert not any(e.get("r") in (71, 180) for e in _PL["secs"][_pc]["ents"]), "merirosvoristeilijat ovat jo listalla"
for _lab, _ref, _pts in _PIR_CRUISERS:
    _PL["secs"][_pc]["ents"].append(_p18_unit(_lab, _ref, _pts, 178, noopt=True))
_PL["secs"][_pc]["ents"].append(_p18_unit("Space Marine Strike Cruiser", 105, 145, 178, mx=1, noopt=True))
_PL["secs"][_pc]["rules"] += [
    dict(kind="per_points", each=1, per=500, what="cruisers", label="Pirate cruisers (one per 500 pts)",
         pick=[dict(sec=_pc), dict(sec=_pn, re="^siluria")], ok=True, sec=[_pc],
         src="A human pirate fleet may have up to one cruiser for every 500 points of ships in the fleet or "
             "portion thereof."),
]
# s.179: "At least one squadron of 3-6 escort vessels must be included for
# each cruiser in the fleet" ja "The number of escort vessels that utilize
# ordnance or lance weaponry may not outnumber those that rely solely on weapon
# batteries. Xenos vessels of all types don't count toward this total."
_ord, _bat = [], []
for _e in _PL["secs"][_pe]["ents"]:
    _sh = ships.get(str(_e.get("r"))) if _e.get("r") else None
    if not _sh or re.search(r"xenos", str(_e["l"]), re.I):
        continue
    _heavy = any(re.search(r"torpedo|lance|launch|bomb|nova", str(a[0]), re.I) for a in _sh["aw"])
    (_ord if _heavy else _bat).append(_e["l"])
assert _ord and _bat, ("merirosvosaattajat", _ord, _bat)
_rx = lambda labs: "^(" + "|".join(re.escape(x) for x in labs) + ")$"
_PL["secs"][_pe]["rules"] += [
    dict(kind="min_ratio", min=1, units=True, label="Escort squadrons per cruiser (at least one)",
         allow_pick=[dict(sec=_pe)], per_pick=[dict(sec=_pc), dict(sec=_pn, re="^siluria")], ok=True, sec=[_pe],
         src="At least one squadron of 3\u20136 escort vessels must be included for each cruiser in the fleet, "
             "organized in any mix desired."),
    dict(kind="compare", op="<=", a_mult=1, label="Escorts with ordnance or lances (not more than battery escorts)",
         a_pick=[dict(sec=_pe, re=_rx(_ord))], b_pick=[dict(sec=_pe, re=_rx(_bat))], ok=True, sec=[_pe],
         src="The number of escort vessels that utilize ordnance or lance weaponry may not outnumber those that "
             "rely solely on weapon batteries. Xenos vessels of all types don't count toward this total."),
]
print("  merirosvot: risteilijoita %d, ordnance/lance-saattajia %d, patterisaattajia %d"
      % (len(_PIR_CRUISERS) + 1, len(_ord), len(_bat)))

# J31 s.197: "Additionally, up to four ships in a Rogue Trader or pirate fleet
# may be Stryxis Caravan Vessels, rolling for leadership normally. They do not
# count as cruisers against their respective fleet lists, but they may not use
# any fleet re-rolls." s.196: 80 pts. Oma osio: ei lasketa risteilijoihin.
_STRYX_SRC = ("Additionally, up to four ships in a Rogue Trader or pirate fleet may be Stryxis Caravan Vessels, "
              "rolling for leadership normally. They do not count as cruisers against their respective fleet lists, "
              "but they may not use any fleet re-rolls.")
for _nm in ("Rogue Traders", "Rogue Traders \u2014 Exploration", "Rogue Traders \u2014 Pirates and Wolf Packs"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 196 for x in _L["secs"] for e in x["ents"]), "%s: Stryxis on jo" % _nm
    _L["secs"].append(dict(t="STRYXIS CARAVAN VESSELS", rules=[], text=[_STRYX_SRC],
                           ents=[_p18_unit("Stryxis Caravan Vessel", 196, 80, 196, mx=4)]))

# J29 s.284: "Only one Activated Blackstone Fortress may be fielded for every
# FULL 750 points of other ships in a Chaos fleet. No more than three may be
# taken." Chaos-listojen valikot eivat nimea sita, mutta profiili sallii sen
# Chaos-laivastossa ja s.288 olettaa sen valittavaksi. Space Hulkin poissulku
# (J26) saa osion mukaan.
_BSF_SRC = ("Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a "
            "Chaos fleet. No more than three may be taken.")
_bsf = 0
for _nm in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
            "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    _L = _p18_list(_nm)
    _others = [i for i, x in enumerate(_L["secs"]) if any(e.get("k") == "unit" and e.get("r") for e in x["ents"])]
    _i = len(_L["secs"])
    _L["secs"].append(dict(t="ACTIVATED BLACKSTONE FORTRESS", text=[_BSF_SRC],
                           ents=[_p18_unit("Activated Blackstone Fortress", 284, 750, 284, mx=3)],
                           rules=[dict(kind="per_points", each=1, per=750, full=True, what="fortresses",
                                       label="Activated Blackstone Fortress (one per FULL 750 pts of other ships)",
                                       pick=[dict(sec=_i)], of_pick=[dict(sec=j) for j in _others],
                                       ok=True, sec=[_i], src=_BSF_SRC)]))
    for x in _L["secs"]:
        for r in x.get("rules") or []:
            if str(r.get("label", "")).startswith("Chaos Space Hulk: not with the Planet Killer"):
                r["cond_pick"] = list(r["cond_pick"]) + [dict(sec=_i)]
                _bsf += 1
assert _bsf == 6, "Space Hulk -poissulkuja odotettiin 6, loytyi %d" % _bsf
# s.284: "It has no crew and so does not add a D6 to its boarding score during
# a boarding action." Chaos Space Marine -miehisto ("Any capital ship can be
# designated as having a Chaos Space Marine crew", s.234) ei koske sita.
_csm = 0
for _L in lists_out:
    for _x in _L["secs"]:
        for _e in _x["ents"]:
            if _e.get("k") == "up" and re.search(r"chaos space marine crew$", str(_e.get("l", "")), re.I):
                _c = dict(_e.get("cond") or {})
                _c["nmno"] = (_c["nmno"] + "|" if _c.get("nmno") else "") + "^activated blackstone"
                _e["cond"] = _c
                _csm += 1
assert _csm == 5, "Chaos Space Marine crew -riveja odotettiin 5, loytyi %d" % _csm
# Kortin saantolaatikko: listalause on nyt tarkistus (J29), warp cannons -kohdan
# kattaa domain.js:n saanto, ja Super-Mega-Death Shot tiivistetaan kirjan
# sanamuotoa seuraten (sama menettely kuin s.480/472). Muuten vauriolaatikko
# painuu alle 4,2 pt:n tulostusrajan.
_bs = ships["284"]
for _need in ("Only one Activated Blackstone Fortress may be fielded", "Super-Mega-Death Shot",
              "It has no crew", "warp cannons roll 1 dice per point of Strength"):
    assert _need in _bs["sr"], "s.284: odotettu kohta puuttuu: %r" % _need
_bs["sr"] = (
    "\u2022 A Blackstone Fortress cannot go onto special orders but is assumed to automatically pass all other "
    "Leadership tests it is required to make. "
    "\u2022 The Blackstone Fortress can move up to 10 cm in any direction in the movement phase: it does not turn "
    "like a normal ship. "
    "\u2022 It has no crew and so does not add a D6 to its boarding score during a boarding action. "
    "\u2022 Super-Mega-Death Shot (not while crippled): after two turns without moving or firing it stays still "
    "and fires in the next shooting phase - trace a straight line 90 cm from its stem with the Nova Cannon "
    "template. Any ship, friend or foe, whose stem touches the template takes 8 lance shots ignoring shields and "
    "similar mechanisms; a ship whose stem touches the centre is destroyed. In Exterminatus, from the low orbit "
    "table, the planet is destroyed on a 2+. Up to three Fortresses never further apart than the template's "
    "diameter may combine the shot: each extra Fortress adds 90 cm of range and 8 lance shots. While charging, "
    "ordnance and escorts touching the area between them are destroyed; a capital ship touching it takes 8 lance "
    "shots per charging Fortress (no shields, no Brace), and each Fortress then takes D6 hits, cannot move or "
    "shoot next turn and must recharge.")
# J33 s.390: "Hulks cannot take any upgrade that improves Boarding Value,
# Turning or Speed." Da Ork Clanzin klaaneista Evil Sunz ("+5 cm speed") ei kay
# hulkille. Goffs ("+1 bonus to the dice roll during boarding actions") kay:
# nopan muunnin ei ole boarding value, ja sama sivu sallii vastaavan Warlordin
# paivityksen ("Mega-armoured Boarding Parties is unchanged"). Pistokoe 19
# kierros 3 (T15) korjasi aiemman Goffs-kiellon.
_clh = 0
for _L in lists_out:
    if _L["nm"] != "Orks \u2014 Da Ork Clanz":
        continue
    for _x in _L["secs"]:
        for _e in _x["ents"]:
            if _e.get("k") == "up" and re.match(r"^Clan: Evil Sunz\b", str(_e.get("l", ""))):
                _c = dict(_e.get("cond") or {})
                _c["nmno"] = (_c["nmno"] + "|" if _c.get("nmno") else "") + "hulk"
                _e["cond"] = _c
                _clh += 1
assert _clh == 1, "Clanz: Evil Sunz -riveja odotettiin 1, loytyi %d" % _clh

for _sh in ships.values():
    _f = SHIP_FL_FIX.get(_sh.get("fl"))
    if _f:
        _sh["fl"] = _f
        _FL_FIXED[0] += 1
assert _FL_FIXED[0] >= 1, "faktion kirjoitusasun korjaus ei osunut kertaakaan"
print("faktion kirjoitusasuja korjattu: %d" % _FL_FIXED[0])

# ---- Komentajat rakenteisesti (P1-8e, docs/DOMAIN_CONTRACT.md) -------------
# Leadership luetaan rivin otsikosta "(Ld 8)" / "(Ld +1)" / "(+2 Ld)" tai rivin
# OMASTA tekstista "adds +1 to its leadership (max 10)"; kiintea arvo ja
# modifier ovat eri kasitteita. Rivit, joille kirja ei anna arvoa, kuitataan
# referenssi/komentajat.json:iin sivuineen - ajossa ei jasenneta tekstia.
# Re-rollit: sisaltyva maara tekstista ("Admirals get one ... re-roll
# included"), ostettavat re-roll-rivit saavat lukumaaran otsikostaan.
import re as _re3
_LD_LABEL = _re3.compile(r"\((?:Ld\s*([+-]?\d+)|([+-]\d+)\s*Ld)\)", _re3.I)
_LD_OWN = _re3.compile(r"adds?\s*\+\s*(\d)\s*to\s*(?:its|the ship'?s)?\s*leadership(?:\s*\(max\.?\s*(\d+)\))?", _re3.I)
_LD_MAX = _re3.compile(r"(?:maximum of|max\.?)\s*(\d+)", _re3.I)
# s.40 (Armageddon): "Your fleet commander gets a single re-roll included in
# his points cost" - "a single" on sama kuin "one" (pistokoe 8: Master of
# the Fleetin ja amiraalien re-roll-summa oli yhden liian pieni).
_RR_INC = _re3.compile(r"\b(?:gets?|has|have|receives?)\s+(?:one|1|a single)\s+(?:fleet commander\s+)?re-?roll", _re3.I)
_RR_N = {"one": 1, "two": 2, "three": 3, "four": 4}
_cref_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "referenssi", "komentajat.json")
_cref = json.load(io.open(_cref_path, encoding="utf-8")) if os.path.exists(_cref_path) else {"commanders": []}
_cref_by = {(r["list"], r["label"]): r for r in _cref.get("commanders", [])
            if r.get("verified") is True and isinstance(r.get("page"), int)}
_cmd_missing, _cmd_n, _cmd_ld, _rr_rows = [], 0, {"fixed": 0, "modifier": 0, "none": 0}, 0
_rrq = []
for _L in lists_out:
    for _si, _sec in enumerate(_L["secs"]):
        _own, _txt = _sec.get("own") or [], _sec.get("text") or []
        _sectext = " ".join(_txt)
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "up":
                if _re3.search(r"re-?rolls?", _e["l"], _re3.I):
                    # Lukumaara voi olla myos nimen jalkeen sulkeissa:
                    # "Aun'O (two extra re-rolls)" (s.454) on kaksi re-rollia.
                    _m = _re3.search(r"\b(one|two|three|four)\b(?:\s+\w+){0,2}\s+re-?rolls?", _e["l"], _re3.I)
                    _e["rr"] = _RR_N[_m.group(1).lower()] if _m else 1
                    _rr_rows += 1
                elif _re3.match(r"\s*the mark of tzeentch\b", _e["l"], _re3.I):
                    # s.236 "The vessel ... gains +1 re-roll", s.232 "The Chaos
                    # Lord gains a re-roll": Mark of Tzeentch on re-roll.
                    _e["rr"] = 1
                    _rr_rows += 1
                continue
            if _e.get("k") != "cmd":
                continue
            _cmd_n += 1
            _owntext = " ".join(t for o, t in zip(_own, _txt) if o == _e["l"])
            _ld = None
            _m = _LD_LABEL.search(_e["l"])
            if _m:
                _v = _m.group(1) or _m.group(2)
                _ld = dict(kind="modifier" if _v[0] in "+-" else "fixed", value=int(_v))
            else:
                # rivin oma teksti; jos osiossa on vain tama yksi komentaja,
                # osion johdantolause kuuluu silla yksiselitteisesti (Ordo
                # Xenos s.141: "The ship adds +1 to its leadership (max. 10)")
                _alone = sum(1 for x in (_sec.get("ents") or []) if x.get("k") == "cmd") == 1
                _m2 = _LD_OWN.search(_owntext) or (_alone and _LD_OWN.search(_sectext))
                if _m2:
                    _ld = dict(kind="modifier", value=int(_m2.group(1)))
            if _ld and _ld["kind"] == "modifier":
                _mx = _LD_MAX.search(_owntext) or _LD_MAX.search(_sectext)
                if _mx:
                    _ld["max"] = int(_mx.group(1))
            _r = _cref_by.get((_L["nm"], _e["l"]))
            if _r is not None and "leadership" in _r:
                _ld = _r["leadership"]
            if _ld is None and _r is None:
                _cmd_missing.append("%s / %s" % (_L["nm"], _e["l"]))
            _e["ld"] = _ld
            _inc = 1 if _RR_INC.search(_owntext + " " + _sectext) else 0
            if _r is not None and "rerolls_included" in _r:
                _inc = _r["rerolls_included"]
            _e["rr"] = _inc
            # Kirjan oma rajaus sisaltyvalle re-rollille (kayttaja 5.10.2026):
            # kenen heittoihin (scope) tai kuinka usein (unit, Abaddon "per
            # turn" s.231). Vain referenssiin sivuineen kuitatut rivit.
            _q = dict((k, _r["rerolls_" + k]) for k in ("scope", "unit")
                      if _r is not None and _r.get("rerolls_" + k))
            if _q:
                # Rajaus voi koskea myos pelkkaa ostettua re-rollia: Chaos Lord
                # "which he can use for his own ship or squadron only" (s.234).
                _q["pg"] = _r["page"]
                _e["rrq"] = _q
                _rrq.append("%s / %s" % (_L["nm"], _e["l"]))
            _cmd_ld[_ld["kind"] if _ld else "none"] += 1
assert not _cmd_missing, "komentajalta puuttuu leadership (kirjaa referenssi/komentajat.json): %s" % _cmd_missing
print("komentajia %d: Ld %s; re-roll-riveja %d" % (_cmd_n, _cmd_ld, _rr_rows))
# Veteran Captain s.38, Veteran Rogue Trader s.174 ja s.176, Abaddon s.234,
# Farseers s.318, Clanz-Warlord s.372; katselmointi 5.10.2026: Pirate Captain
# s.178 ja Chaos Lordit s.234, 236, 240, 244, 248 (ostetun re-rollin rajaus).
assert len(_rrq) == 12, "re-rollin rajauksia odotettiin 12, loytyi %d: %s" % (len(_rrq), _rrq)

# s.453 Kor'O'Mesme: "Re-rolls: 2". Osion yleislause "The commander has one
# re-roll included in his points cost." (s.456) ei pade hanelle, mutta
# komentajakortti tulosti molemmat: kaksi eri lukua samalla kortilla
# (katselmointi 5.10.2026). Lause jaa Kor'elin ja Kor'On korteille; Mesmen
# riville kirjataan, etta sita ei tulosteta (domain.js commanderRules).
_mesme = 0
for _L in lists_out:
    if _L["nm"] != "Tau \u2014 Commerce Protection":
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "cmd" and "Mesme" in _e["l"]:
                _one = [_t for _t in _sec.get("text") or [] if _t == "The commander has one re-roll included in his points cost."]
                assert len(_one) == 1 and _e.get("rr") == 2, "Mesmen osion yleislause tai re-roll-maara muuttui"
                _e["skiptx"] = _one
                _mesme += 1
assert _mesme == 1, "Kor'O'Mesmen rivia odotettiin 1, loytyi %d" % _mesme

# s.258 Scion of Prospero: "This ship bears the Mark of Tzeentch as part of
# its point cost" (Mark: "gains +1 re-roll", s.236) ja "The ship is gifted
# with an additional re-roll added to that from the Mark of Tzeentch" -
# aluksen omia re-rolleja on kaksi ja ne sisaltyvat 450 pisteeseen.
# Profiilissa ne ovat vain lauseina; rr tekee niista ruudut (domain.js
# shipRerolls). Katselmointi 5.10.2026.
_scion = ships["258"]
assert "SCION OF PROSPERO" in _scion["nm"].upper() and "additional re-" in json.dumps(_scion), "s.258 ei ole Scion of Prospero tai Vagaries of Fate -lause puuttuu"
assert "rr" not in _scion
_scion["rr"] = 2

# Laivaston oma re-roll ilman komentajaa (kayttaja 5.10.2026: hintaan
# sisaltyva re-roll sanotaan aina nakyvasti). "The fleet gets one re-roll and
# can purchase extra re-rolls at the cost shown" - Necrons s.404, Demiurg
# s.486. Listalle frr = maara, sivu ja kirjan lause; domain.js fleetRerolls
# lukee sen, eika mikaan pinta jasenna tekstia ajossa.
_FRR = _re3.compile(r"^The fleet gets (one|two|three) re-\s*rolls?\b", _re3.I)
_frr = []
for _L in lists_out:
    for _sec in _L["secs"]:
        for _t in _sec.get("text") or []:
            _m = _FRR.match(_t)
            if not _m:
                continue
            assert "frr" not in _L, "kaksi laivaston re-roll-lausetta: %s" % _L["nm"]
            _how = [_x for _x in _sec.get("text") or [] if "purchased by the fleet as a whole" in _x]
            assert len(_how) == 1, "laivaston re-rollin luonnelause puuttuu: %s" % _L["nm"]
            _L["frr"] = dict(n=_RR_N[_m.group(1).lower()], pg=_L["pg"], sec=_sec["t"],
                             src=_re3.sub(r"re-\s+roll", "re-roll", _t), how=_how[0])
            # s.486: "These re-rolls can only be used for Demiurg vessels and
            # not with other starships they may take as allies in their war host."
            _only = [_re3.match(r"These re-rolls can only be used for (\w+) vessels\b", _x) for _x in _sec.get("text") or []]
            _only = [_o for _o in _only if _o]
            if _only:
                _L["frr"]["scope"] = "%s vessels only" % _only[0].group(1)
            _frr.append("%s s.%s%s" % (_L["nm"], _L["pg"], " (%s)" % _L["frr"]["scope"] if _only else ""))
assert len(_frr) == 2 and any("Necrons" in x and "404" in x and "only" not in x for x in _frr) \
    and any("Demiurg" in x and "486" in x and "Demiurg vessels only" in x for x in _frr), \
    "laivaston oma re-roll: odotettiin Necrons s.404 ja Demiurg s.486, loytyi %s" % _frr
print("laivaston oma re-roll: %s" % "; ".join(_frr))

# s.430 Tyranid Hive Fleet: "The Tyranid player may opt to include the direct
# influence of the Hive Mind in lieu of having a fleet commander. ... Hive
# Mind Influence re-rolls work in the same way as normal fleet commander
# re-rolls." "A maximum of one Hive Mind Influence re-roll can be purchased
# per hive ship in the fleet." Laivaston re-rolleja ilman komentajaa, mutta
# yhtaan ei sisally hintaan ja jokainen emoalus voi ostaa yhden (each + per:
# osio, jonka alukset maaraavat katon). Rivi merkitaan laivaston re-rolliksi
# (frw), jottei se ole aluksen oma. Katselmointi 5.10.2026.
_ty = 0
for _L in lists_out:
    if _L["nm"] != "Tyranids \u2014 Hive Fleet":
        continue
    for _sec in _L["secs"]:
        _same = [_t for _t in _sec.get("text") or [] if _t.startswith("Hive Mind Influence re-rolls work in the same way as normal fleet commander re-rolls")]
        _rows = [_e for _e in _sec.get("ents") or [] if _e.get("k") == "up" and _e["l"] == "Hive Mind Influence re-roll"]
        if not (_same and _rows):
            continue
        assert "frr" not in _L and len(_rows) == 1 and _rows[0].get("rr") == 1
        assert any(_s2["t"] == "HIVE SHIPS" for _s2 in _L["secs"]), "Tyranid Hive Fleet: osio HIVE SHIPS puuttuu"
        _rows[0]["frw"] = 1
        _L["frr"] = dict(n=0, pg=_L["pg"], sec=_sec["t"], each=1, per="HIVE SHIPS", src=_same[0], how=_same[0])
        _ty += 1
assert _ty == 1, "Tyranid Hive Fleetin Hive Mind -osiota odotettiin 1, loytyi %d" % _ty

# s.184 Xenos Vessel: "each Xenos vessel also has one selected xenotech
# system as described in the Rogue Trader special rules. This system does
# not cost extra points and may be selected by the owning player for free"
# - s.175:n taulukko kuutena ilmaisena valintana, yksi per alus. Nimetyt
# variantit (s.185-188) sisaltavat omansa jo profiilissa. Pistokoe 5, rivi 10.
if "184" in ships:
    _xv = ships["184"]
    assert not _xv.get("ol"), "Xenos Vessel s.184: odotettiin tyhjaa optiolistaa"
    _XT = [
        ("Long Range Sensors: The vessel adds +1 to its base leadership (max. of Ld 10).", {}),
        ("Targeting Matrix: The vessel counts all targets as closing when using the gunnery "
         "table within 30 cm and ignores right-shift modifiers for shooting greater than 30 cm.", {}),
        ("Advanced Shielding: The vessel increases the strength of its shields by +1.", dict(mod=dict(sh=1))),
        ("Ship Defense Grid: The vessel increases the strength of its turrets by +1.", dict(mod=dict(tu=1))),
        ("Advanced Drive Technology: The vessel adds +5 cm to its speed as well as +1D6 when "
         "undergoing All Ahead Full special orders.", dict(set=dict(sp="30 cm"))),
        ("Gravitic Thrusters: The vessel can double the maximum rate of its normal turn.", dict(set=dict(tn="180°"))),
    ]
    _xv["ol"] = [dict(t="Xenotech system (free, choose one) — " + _t, c=0, var=0,
                      grp="xenotech", gmax=1, **_eff) for _t, _eff in _XT]

# s.376 Dethdeala: "The rules for the bombardment cannon can be found on
# pg. 94." on viittaus, ei saanto - se esti kortin oman Bombardment Cannon
# -saannon (domain.js selfText). Pistokoe 4, rivi 54.
_ptr = "The rules for the bombardment cannon can be found on pg. 94."
_ptr_hits = 0
for _sh in ships.values():
    _sr = _sh.get("sr") or ""
    if _ptr in _sr:
        _sh["sr"] = re.sub(r"\s*•?\s*" + re.escape(_ptr), "", _sr).strip()
        _ptr_hits += 1
assert _ptr_hits == 1, "bombardment-viittauslause: odotettiin 1 osuma, %d" % _ptr_hits

# s.181 Endeavour: "Instead of the Endeavour, Rogue Traders may use a
# lance-armed Dauntless light cruiser for +15 points ... This is already
# reflected in the point cost in the fleet list." Listahuomautus, ei aluksen
# varuste: Dauntless on oma rivi (s.174, 125 pts). Optio poistetaan, jotta
# kortti ei tarjoa +15 pts -ruksia ilman vaikutusta. Pistokoe 4, rivi 81.
DROP_OPTS = [("181", "Instead of the Endeavour, Rogue Traders may use a lance-armed Dauntless"),
             # s.180: sama laji - Exploration-listan huomautus (Lunar/Tyrant/
             # Carnage/Murder omina riveina), ei Rogue Trader Cruiserin varuste.
             # Lause mainitsee Nova Cannonin ja toi sen saannon kortille.
             # Pistokoe 5 (10.9.2026), rivi 51.
             ("180", "Rogue Trader cruisers in an Exploration fleet may also be of the following")]
for _pg, _frag in DROP_OPTS:
    _ol = ships[_pg]["ol"]
    _keep = [o for o in _ol if _frag not in o["t"]]
    assert len(_keep) == len(_ol) - 1, "DROP_OPTS: s.%s %r osui %d kertaa" % (_pg, _frag, len(_ol) - len(_keep))
    ships[_pg]["ol"] = _keep

# Tiedoksi-lauseet, jotka kirja painaa OPTIONS-otsikon alle mutta jotka eivat
# ole valintoja (pistokoe 8 rivit 36 ja 48): "... already included in its
# profile" (s.186, 188), "... see the special ability above" (s.187) ja "If
# the torpedo refit is taken, the ship does not have to be modified ..."
# (s.150). Kortilla ne olivat ruksattavia optioita ja estivat valmiin PTS:n;
# ne siirtyvat aluksen SPECIAL-teksteihin sellaisinaan.
OPT_TO_SR = [("150", "If the torpedo refit is taken"),
             ("186", "already included in its profile"),
             ("187", "see the special ability above"),
             ("188", "already included in its profile")]
for _pg, _frag in OPT_TO_SR:
    _ol = ships[_pg]["ol"]
    _mv = [o for o in _ol if _frag in o["t"]]
    assert len(_mv) == 1, "OPT_TO_SR: s.%s %r osui %d kertaa" % (_pg, _frag, len(_mv))
    ships[_pg]["ol"] = [o for o in _ol if o is not _mv[0]]
    ships[_pg]["sr"] = ((ships[_pg].get("sr") or "") + " \u2022 " + _mv[0]["t"].strip()).strip()

# Optio, jonka kirja sanoo ilmaiseksi ("for no additional cost", "no change
# in cost", "already included in its profile", "Instead of taking one of the
# above"), on 0 pts eika "see text": kortti tulostaa "free". Pistokoe 6:n
# laaja tarkastus (10.9.2026) loysi 19 tallaista option ruutua.
_FREE_OPT = re.compile(r"no (?:additional|extra) (?:points? )?cost|no change in cost|for free\b"
                       r"|already included|no extra points|costs no extra|at no cost"
                       r"|see the special ability above|Instead of taking one of the above", re.I)
_free_hits = 0
for _sh in ships.values():
    for _o in _sh.get("ol") or []:
        if _o.get("c") is None and _FREE_OPT.search(_o.get("t") or ""):
            _o["c"] = 0
            _free_hits += 1
assert _free_hits == 16, "ilmaisia optioita odotettiin 16, loytyi %d" % _free_hits

# Pysyva option-ID (P1-8a, docs/SAVE_SCHEMA.md): sivu + sha1(normalisoitu
# teksti)[:8]. Syntyy datasta, ei kasin; tallenne viittaa optioon talla eika
# indeksilla, joten kirjan uusi versio voi siirtaa optioita rikkomatta
# tallenteita. domain.js:n normOptText tekee saman normalisoinnin.
import hashlib as _hashlib, re as _re
def _opt_id(pgkey, text):
    n = _re.sub(r"[^a-z0-9]", "", str(text or "").lower())   # koko teksti: s.255:n kaksi optiota eroavat vasta 90. merkista
    return "%s:%s" % (pgkey, _hashlib.sha1(n.encode("ascii")).hexdigest()[:8])
_n_ids = 0
for _k, _sh in ships.items():
    _seen = set()
    for _o in _sh.get("ol") or []:
        _o["id"] = _opt_id(_k, _o.get("t"))
        assert _o["id"] not in _seen, "option-ID ei ole uniikki: s.%s %r" % (_k, _o.get("t"))
        _seen.add(_o["id"])
        _n_ids += 1
print("optio-ID:t annettu: %d" % _n_ids)

for _fx in KEEP_TEXT:
    assert _fx.get("_used"), "KEEP_TEXT ei osunut: %r" % _fx
# Torpedovaihto ilman nopeutta lauseessa: swaps.py antaa 30 cm (Rulebook
# s.76; kaikki Imperial/Chaos-torpedorivit ovat 30 cm). Vartija: yksikaan
# vaihtorivi ei saa jaada "see text" -kantamalle.
_seetext = [(k, r) for k, sh in ships.items() for o in sh.get("ol") or [] if o.get("sw")
            for r in o["sw"]["t"] if r[1] == "see text"]
assert not _seetext, "vaihtorivi ilman kantamaa: %s" % _seetext[:4]

# Profiilin SPECIAL-tekstin kertomuslauseet jaavat kirjaan: kortti toistaa
# saannot, ei tarinaa. Hammer (Fleets p. 374): kolme lausetta Uzog
# Armripperista ja Garzogista olivat 40 % kortin saantolaatikosta (kohta 10).
# Jokaisen on osuttava, muuten ajo kaatuu - kuten KEEP_TEXT.
DROP_SR = [
    "The prow launchers commonly seen on the Hammer",
    "ingenious solution was to rig up parts of the nova cannon",
    "Garzog thus got it half right",
]
for _frag in DROP_SR:
    _hit = 0
    for _sh in ships.values():
        _sr = _sh.get("sr") or ""
        if _frag not in _sr:
            continue
        _new = re.sub(r"\s*[^.!?•]*" + re.escape(_frag) + r"[^.!?]*[.!?]", "", _sr)
        assert _new != _sr and _frag not in _new, "DROP_SR: lause ei irronnut: %r" % _frag
        _sh["sr"] = _new
        _hit += 1
    assert _hit, "DROP_SR ei osunut: %r" % _frag
# Paivitysrivien kuvaukset, joille kirjan osio ei anna rivin omaa lausetta tai
# antaa vaaran (pistokoe 8, 10.9.2026): orkkien Warlordin re-roll-rivi sai
# kuvaukseksi seuraavan kappaleen johdannon (s.365, 366, 372), ja 17 Chaos
# Mark -rivia tulosti yleistekstin "Fleet-list upgrade", vaikka listan oma
# sivu kertoo Markin vaikutuksen. Lauseet kirjasta; asetetaan vain riville,
# jolla ei ole omaa kuvausta (desc).
DESC_FIX = [
    (r"^Orks", r"^WARLORD$", r"^One extra re-roll$",
     "One more re-roll for the Warlord, two in total (Warlords get one re-roll)."),
    (r"^Orks", r"^WARLORD$", r"^Two extra re-rolls$",
     "Two more re-rolls for the Warlord, three in total (Warlords get one re-roll)."),
    # s.40: rivin kuvauksena oli osion loppuhuomautus "Note: Command duties were shared ..."
    (r"Armageddon", r"^Master of the Fleet Re-rolls$", r"^Three extra re-rolls$",
     "Three more re-rolls for the Master of the Fleet, four in total (the fleet commander gets a single re-roll included in his points cost)."),
    (r"Incursion$", r"^Chaos Lords$", r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their Leadership value. This is an area effect that is not affected by line of sight obstructions.'),
    (r"Incursion$", r"^Chaos Lords$", r"^The Mark of Khorne$",
     "The Chaos Lord's ship doubles its value in boarding actions."),
    (r"Black Crusade$", r"^(Chaos Lords|DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Khorne$", 'Crewed by the homicidal followers of Khorne, the ship is extremely dangerous in boarding actions. It doubles its value in boarding actions.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their Leadership value. This is an area effect that is not affected by line of sight obstructions.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Tzeentch$", 'The Captain can call upon the power of precognition as well as formidable magics to control his vessel. This ship has an extra re-roll.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Nurgle$", 'The vessel is rank with putrescence and the many plagues of the Lord of Decay. It gains 1 Damage Point and may not be boarded.'),
    (r"Tzeentch$", r"^(Chaos Warmaster of Tzeentch|CHAOS SPACE MARINE CREWS|DAEMONSHIPS)$",
     r"^The Mark of Tzeentch$", 'The vessel is given command of the Fates by its patron god and gains +1 re-roll.'),
    (r"Nurgle$", r"^(Chaos Warmaster of Nurgle|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Nurgle$", 'The vessel is rank with putrescence and the many plagues of the Lord of Decay. It gains 1 Damage Point and may not be boarded.'),
    (r"Khorne$", r"^(Chaos Warmaster of Khorne|Chaos Lords|CHAOS SPACE MARINE CREWS)$",
     r"^The Mark of Khorne$", 'Crewed by homicidal, blood-crazed followers of Khorne, it doubles its value in boarding actions.'),
    (r"Slaanesh$", r"^(Chaos Warmaster of Slaanesh|CHAOS SPACE MARINE CREWS)$",
     r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their leadership value.'),
]
_desc_hits = []
for _lrx, _srx, _nrx, _d in DESC_FIX:
    _n = 0
    for Lx in lists_out:
        if not re.search(_lrx, Lx["nm"]):
            continue
        for s in Lx["secs"]:
            if not re.search(_srx, s["t"].strip()):
                continue
            for e in s["ents"]:
                if e.get("k") == "up" and re.search(_nrx, str(e["l"]).strip()) and not e.get("desc"):
                    e["desc"] = _d
                    _n += 1
    assert _n, "DESC_FIX ei osunut: %r / %r / %r" % (_lrx, _srx, _nrx)
    _desc_hits.append(_n)
print("kuvauskorjauksia: %d" % sum(_desc_hits))
# 24 + Black Crusaden miehiston nelja Markia (pistokoe 11)
assert sum(_desc_hits) == 28, "DESC_FIX: odotettiin 28 riviä, osui %d" % sum(_desc_hits)

# Tyranidien bio-refitit (s.426): "These refits can be incorporated by capital
# ships or individual escorts except where specifically noted otherwise for
# the cost indicated" - saattueessa jokainen alus maksaa (pistokoe 9 rivit 14,
# 62 ja 73: kuuden Krakenin Solar Vanes maksoi 15 eika 90).
_bio_per = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Tyranids"):
        continue
    for s in Lx["secs"]:
        if s["t"].strip().upper() != "BIO-ENHANCEMENTS":
            continue
        for e in s["ents"]:
            if e.get("k") == "up" and not e.get("per"):
                e["per"] = "hull"
                _bio_per += 1
print("tyranidien bio-refiteja aluskohtaisiksi: %d" % _bio_per)
assert _bio_per == 28, "tyranidien bio-refiteja odotettiin 28, loytyi %d" % _bio_per

# Zukov's Klaw (s.381): "It is of the Goff Clan", "It is upgraded to be an
# Assault Karrier with boarding torpedoes ... but it may not use any other
# types of attack craft", "It is also equipped with Klaws as part of its point
# cost" - klaanit, Assault Karrier, boarding torpedoes, Klaws ja torpedo-bommas
# eivat ole sille ostettavia (pistokoe 9 rivi 76).
_zk = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Orks"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            if e.get("k") != "up":
                continue
            if re.search(r"^(?:Clan: |Boarding torpedoes|Torpedo-bommas|Klaws|Assault Karrier)", str(e["l"])):
                c = dict(e.get("cond") or {})
                c["nmno"] = (c["nmno"] + "|" if c.get("nmno") else "") + "zukov"
                e["cond"] = c
                _zk += 1
print("Zukov-rajauksia: %d" % _zk)
assert _zk == 20, "Zukov-rajauksia odotettiin 20, loytyi %d" % _zk

# Adeptus Mechanicus (s.125 ORDNANCE): "They may not use assault boats, even
# if their Imperial Navy counterparts may have access to this type of
# ordnance (such as Emperor battleships)" - Emperorin ja Oberonin oma Shark
# assault boats -optio ei ole Mechanicus-listassa valittavissa (J11).
_optno = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Adeptus Mechanicus"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any(re.search(r"shark assault boat", o.get("t") or "", re.I) for o in _sh.get("ol") or []):
                e["optno"] = r"shark assault boat"
                _optno += 1
assert _optno == 2, "Mechanicus-listan Shark-optioita odotettiin 2, loytyi %d" % _optno

# Grey Knights s.144: "An Inquisitor Lord gets one re-roll, and may purchase
# up to two more re-rolls for +25 points each" koskee myos Ordo Malleus
# Inquisitor Lordia; lisa-re-rollit kiinnittyivat vain edeltavaan riviin
# (pistokoe 10 rivi 46).
_gk_rr = 0
for Lx in lists_out:
    if Lx["nm"] != "Grey Knights":
        continue
    for _si, s in enumerate(Lx["secs"]):
        if s["t"].strip() != "FLEET COMMANDER":
            continue
        _cmds = [[_si, _ei] for _ei, e in enumerate(s["ents"]) if e.get("k") == "cmd"]
        assert len(_cmds) == 2, "Grey Knights FLEET COMMANDER: komentajia %d" % len(_cmds)
        for e in s["ents"]:
            if e.get("k") == "up" and re.search(r"extra re-roll", str(e["l"]), re.I):
                e["at"] = _cmds
                _gk_rr += 1
assert _gk_rr == 2, "Grey Knights: lisa-re-roll-riveja odotettiin 2, loytyi %d" % _gk_rr

# s.84 Cobra: long range detection gear - "Only Imperial escort squadrons may
# take this refit, not pirates, Chaos renegades, etc." (pistokoe 10 rivi 67).
_pir = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Rogue Traders — Pirates"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any(re.search(r"long range detection", o.get("t") or "", re.I) for o in _sh.get("ol") or []):
                assert not e.get("optno")
                e["optno"] = r"long range detection"
                _pir += 1
assert _pir >= 1, "Pirates-listan Cobra-rivia ei loytynyt"
print("Pirates-listan detection gear -kieltoja: %d" % _pir)

# s.48: Lord Admiral Rathin sivulaatikon lauseet kuuluvat vain Rathin riville.
# Omistajana oli laatikon otsikko "Lord Admiral Rath", joka ei vastaa rivin
# nimea "Lord Admiral Rath (Ld10)", joten commanderRules naytti lauseet
# jokaiselle amiraalille (pistokoe 11 rivi 21). Omistaja rivin nimeksi ja
# ownx: lause vain omistajansa kortille.
_box = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if not s.get("own"):
            continue
        _labels = [e["l"] for e in s["ents"]]
        for _i, _o in enumerate(s["own"]):
            if not _o or _o in _labels:
                continue
            _hit = [e["l"] for e in s["ents"] if e.get("k") == "cmd" and str(e["l"]).startswith(_o + " (")]
            if len(_hit) != 1:
                continue
            s["own"][_i] = _hit[0]
            _ox = s.setdefault("ownx", [])
            if _i not in _ox:
                _ox.append(_i)
            _box += 1
assert _box == 5, "komentajan sivulaatikon lauseita odotettiin 5 (Rath), loytyi %d" % _box

# s.372 Da Ork Clanz, WARLORD-laatikko: hintarivien ("One extra re-roll +20",
# "Two extra re-rolls +40") JALKEEN tulee kolme Warlordin omaa lausetta -
# Gubbins per re-roll, "He must be embarked on the most expensive ship under
# his own command" ja "A Warlord's re-rolls only count for the skwadrons under
# his command and not for the whole fleet". Poimija antoi ne viimeiselle
# hintariville, joten komentajakortti naytti ne vain, kun kaksi lisa-re-rollia
# oli otettu (kayttaja 5.10.2026: re-rollit ja niiden rajaus aina nakyvissa).
_cz_own = 0
for Lx in lists_out:
    if Lx["nm"] != "Orks \u2014 Da Ork Clanz":
        continue
    for s in Lx["secs"]:
        if s["t"] != "WARLORD" or not s.get("own"):
            continue
        for _i, (_o, _t) in enumerate(zip(s["own"], s["text"])):
            if _o == "Two extra re-rolls" and re.match(r"(A Warlord may choose for his own ship|He must be embarked on the most expensive ship|A Warlord.s re-rolls only count)", _t):
                s["own"][_i] = "Ork Warlord"
                _cz_own += 1
assert _cz_own == 3, "Clanz-Warlordin omia lauseita odotettiin 3, loytyi %d" % _cz_own

# s.494: "Warspheres 10HP or greater may ..." - kolme optiota vaatii 10 HP,
# domain.js optionsOf estaa ne HP:n ollessa alle (pistokoe 12 rivi 66).
_hpm = 0
for _o in ships["494"]["ol"]:
    if "10hp or greater" in _o["t"].lower():
        _o["hpmin"] = 10
        _hpm += 1
assert _hpm == 3, "Warsphere: 10HP-optioita odotettiin 3, loytyi %d" % _hpm

# s.22 Acquisition: "Any ship with launch bays can be upgraded to carry torpedo
# bombers at an additional cost of +10 pts per Strength point of the launch bays
# on the vessel" (esimerkit Chaos Styx 60, Imperial Dictator 40); "Eldar or Tau
# vessels must pay +15 points per launch bay instead of +10"; "Fleets that do not
# normally have access to bombers also do not have access to torpedo bombers."
# Rivi lisataan listoille, joilla sita ei ole. Orkkien hinnat ovat alusten
# omissa kuvauksissa (s.22), ja Space Marine- ja Inkvisitioalusten bayt
# kantavat vain Thunderhawkeja (pistokoe 12).
_TB_BOMB = re.compile(r"bomber|starhawk|doomfire|eagle|phoenix|razorwing|manta", re.I)
_TB_XENO = r"^(ELDAR|DARK ELDAR|TAU)"
_TB_NOT10 = r"^(ELDAR|DARK ELDAR|TAU|SPACE MARINES|INQUISITION)"
_tb_tpl = [e for Lx in lists_out if Lx["nm"] == "Imperial Navy — Bakka Sector"
           for s in Lx["secs"] for e in s["ents"] if e.get("k") == "up" and e["l"] == "Torpedo bombers"]
assert len(_tb_tpl) == 1, "Bakkan Torpedo bombers -mallirivi ei loydy"
_tb_log = []
for Lx in lists_out:
    if Lx["nm"].startswith("Orks"):
        continue
    _tbrows = [e for s in Lx["secs"] for e in s["ents"]
               if e.get("k") == "up" and re.match(r"torpedo bombers", str(e["l"]), re.I)]
    _fl = set()
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any("launch bay" in str(a[0]).lower() and _TB_BOMB.search(str(a[1])) for a in _sh["aw"]):
                _fl.add(_sh["fl"])
    if not _fl:
        continue
    _xeno = any(re.match(_TB_XENO, f) for f in _fl)
    _other = any(not re.match(_TB_NOT10, f) for f in _fl)
    # Tau: vain bayt, joissa on Mantoja - "Mantas are bombers" (s.450);
    # Barracuda on havittaja, joten Emissaryn (Dal'yth) bayssa ei ole
    # muunnettavia pommittajia.
    _xtau = all(f.startswith("TAU") for f in _fl if re.match(_TB_XENO, f))
    _xhas = "launch bay@Manta" if _xtau else "launch bay"
    _xlab = "Torpedo bombers (Tau vessel)" if _xtau else "Torpedo bombers (Eldar or Tau vessel)"
    _add = []
    if not _tbrows:
        if _other:
            _add.append(("Torpedo bombers", 10, dict(has="launch bay", flno=_TB_NOT10)))
        if _xeno:
            _add.append((_xlab if _other else "Torpedo bombers", 15, dict(has=_xhas, fl=_TB_XENO)))
    elif Lx["nm"] == "Demiurg — War Host" and _xeno:
        # listan oma rivi koskee Demiurg-aluksia (s.487); Tau-alukset s.22:n mukaan
        _add.append(("Torpedo bombers (Tau vessel)", 15, dict(has=_xhas, fl=_TB_XENO)))
    if not _add:
        continue
    _sec = [s for s in Lx["secs"] if s["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    for _lab, _p, _cond in _add:
        assert not any(e["l"] == _lab for e in _sec["ents"]), "%s: %s on jo" % (Lx["nm"], _lab)
        _row = dict(_tb_tpl[0])
        _row.pop("at", None)
        _row.update(l=_lab, p=_p, cond=_cond, src_page=22)
        _sec["ents"].append(_row)
        _tb_log.append("%s: %s %d" % (Lx["nm"], _lab, _p))
for _x in _tb_log:
    print("  torpedo bombers +", _x)
assert len(_tb_log) == 19, "torpedo bombers -riveja odotettiin 19, lisattiin %d" % len(_tb_log)

# s.19 SPECIAL TORPEDOES: "If you're playing in a one-off game, rolls on the
# Special Torpedoes table can be purchased for the number of points shown
# below." Up to Strength 6 20 points, 7 or more 30 points. "No ship may be
# equipped with more than one special torpedo type. Escort squadrons and
# defences may not be equipped with special torpedoes at all. Ork ships may
# only use special torpedoes if they have been upgraded to have Looted
# Torpedoes, but count as having a Torpedo Strength of up to 6. Eldar and Dark
# Eldar ships pay double points (...). The Tau (...) may not use the special
# torpedo rules at all. Likewise, Tyranids (...) cannot have special
# torpedoes." Pistokoe 18 (kirjainventaario) loysi kohdan puuttuvan kokonaan.
_ST_HAS = r"torpedo|launcha"
_ST_ROW = re.compile(r"torpedo|launcha", re.I)
_ST_NOTROW = re.compile(r"bomb|boarding", re.I)
# qd=1: kvadranttilinnakkeet ovat ainoa poikkeus puolustusten kieltoon. s.503
# SPECIAL TORPEDO REFITS: "A Ramilies can purchase special torpedoes", ja
# Fortress-Monastery "follows all rules for the Ramilies" (s.110). Hinta on
# s.19:n taulukosta: Torpedo silos vahvuus 9 -> "7 or more", 30 pistetta.
# Kayttajan paatos 13.10.2026 (BACKLOG J174); aiemmin riveja ei tarjottu.
_ST_BASE = dict(cap=1, ty=r"^(?!defence)", qd=1, has=_ST_HAS, noup=r"^Special torpedoes")
_ST_DESC = ("Before the game roll a D6 on the Special Torpedoes table: 1 Short Burn, 2 Guided, 3 Seeking, "
            "4 Barrage Bombs, 5 Melta, 6 Vortex. One special torpedo type per ship; not for escorts or "
            "defences, except a Ramilies or Fortress-Monastery (Fleets p. 503). Eldar and Dark Eldar pay "
            "double; Tau and Tyranids cannot have them; Orks only with "
            "Looted Torpedoes, counting as Strength up to 6. (Fleets p. 19)")
_st_log = []
for Lx in lists_out:
    _grp = set()
    for s_ in Lx["secs"]:
        for e in s_["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if not _sh or re.search(r"escort|defence", str(_sh.get("ty", "")), re.I):
                continue
            if not any(_ST_ROW.search(str(a[0])) and not _ST_NOTROW.search(str(a[0])) for a in _sh["aw"]):
                continue
            _f = str(_sh.get("fl", ""))
            if re.match(r"^(TAU|TYRANID|NECRON)", _f, re.I):
                continue
            _grp.add("ELDAR" if re.match(r"^(ELDAR|DARK ELDAR)", _f, re.I)
                     else "ORK" if re.match(r"^ORK", _f, re.I) else "STD")
    _add = []
    if "STD" in _grp:
        _no = dict(flno=r"^(ELDAR|DARK ELDAR|TAU|TYRANID|NECRON|ORK)")
        _add.append(("Special torpedoes (Strength up to 6)", 20, dict(_ST_BASE, tsmax=6, **_no)))
        _add.append(("Special torpedoes (Strength 7 or more)", 30, dict(_ST_BASE, tsmin=7, **_no)))
    if "ELDAR" in _grp:
        _fl = dict(fl=r"^(ELDAR|DARK ELDAR)")
        _add.append(("Special torpedoes (Eldar, Strength up to 6)", 40, dict(_ST_BASE, tsmax=6, **_fl)))
        _add.append(("Special torpedoes (Eldar, Strength 7 or more)", 60, dict(_ST_BASE, tsmin=7, **_fl)))
    if "ORK" in _grp:
        _add.append(("Special torpedoes (Looted Torpedoes)", 20,
                     dict(_ST_BASE, fl=r"^ORK", up=r"^Looted Torpedoes")))
    if not _add:
        continue
    _sec = [x for x in Lx["secs"] if x["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    for _lab, _p, _cond in _add:
        assert not any(e["l"] == _lab for e in _sec["ents"]), "%s: %s on jo" % (Lx["nm"], _lab)
        _row = dict(_tb_tpl[0])
        for _k in ("at", "per"):
            _row.pop(_k, None)
        _row.update(l=_lab, p=_p, cond=_cond, src_page=19, desc=_ST_DESC,
                    nt="One roll on the Special Torpedoes table.")
        _sec["ents"].append(_row)
        _st_log.append("%s: %s %d" % (Lx["nm"], _lab, _p))
for _x in _st_log:
    print("  special torpedoes +", _x)
print("special torpedoes -riveja %d" % len(_st_log))
assert len(_st_log) >= 40, "special torpedoes -riveja odotettiin ainakin 40, lisattiin %d" % len(_st_log)

# s.23 Acquisition: "Any ship with launch bays can be refitted to carry orbital
# mines instead of attack craft at a points cost of +5 points per launch bay
# strength. ... Only cruisers may be refitted to carry orbital mines;
# battleships are considered too rare and valuable to use in this way."
# Profiilin tyyppi Cruiser (myos heavy-, battle- ja light cruiser) ja grand
# cruiser (Fleets s.14 laskee ne "cruisers"-ryhmaan; s.23 sulkee pois vain
# battleshipit - J21, nameless Discordissa), battleship ei. Tyranidit (omat Mega-Spore Mines) ja Necronit
# rajattu pois (pistokoe 12). Orkit mukana: s.360 "Orks may buy orbital mines
# like other fleets at +5 pts per (maximal) launch bay strength ... Ork Space
# Hulks cannot take orbital mines" (pistokoe 13; rajaus pistokoe 12:ssa oli vaara).
_OM_DESC = ("Orbital mines replace all the attack craft in the ship's launch bays: one mine per launch bay "
            "Strength is launched like attack craft, mines cannot form waves and are not subject to ordnance "
            "limits. A critical hit affecting the launch bays causes an extra D3 damage. Cruisers and grand cruisers only, "
            "not battleships; not with torpedo bombers or other attack craft upgrades; "
            "intended as a surprise tactic - at most one or two mine-armed ships. (Fleets p. 23)")
_om_log = []
for Lx in lists_out:
    if re.match(r"^(Tyranids|Necrons)", Lx["nm"]):
        continue
    if any(e.get("k") == "up" and re.match(r"orbital mines", str(e["l"]), re.I) for s in Lx["secs"] for e in s["ents"]):
        continue
    _hit = False
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and re.match(r"^(grand )?cruiser$", str(_sh["ty"]), re.I) and any("launch bay" in str(a[0]).lower() for a in _sh["aw"]):
                _hit = True
    if not _hit:
        continue
    _sec = [s for s in Lx["secs"] if s["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    # noup/offopt: miinat korvaavat KAIKKI hyokkaysalukset (s.23), joten ei
    # torpedo bombereita (s.22 "an additional type of attack craft") eika aluksen
    # omia hyokkaysalusvalintoja (Shark assault boats s.59, Vampire raiders s.330,
    # orkkien torpedo-bommat aluksen omana optiona s.359).
    _omcond = dict(ty=r"^(grand )?cruiser$", has="launch bay", noup=r"^torpedo[\s-]*bom",
                   offopt=r"shark assault boats|vampire raiders|torpedo[\s-]*bom")
    if Lx["nm"].startswith("Orks"):
        # s.360 Ork Space Hulk ei; Zukov's Klawin bayt ovat Assault Karrier (s.381)
        _omcond["nmno"] = r"hulk|zukov"
    _sec["ents"].append(dict(l="Orbital mines", r=None, p=5, a=1, u=1, mx=None, k="up", per="bay",
                             nt="Per launch bay strength.", prose=1, src_page=23,
                             cond=_omcond, desc=_OM_DESC,
                             # s.23: launch bay -rivit muuttuvat miinariveiksi, 10 cm (s.512),
                             # yksi miina per bay-vahvuus (domain.js permine).
                             swp=dict(f=r"launch bays?", nm="orbital mines", nmf=r"launch bays?",
                                      rg="10 cm", permine=1)))
    _om_log.append(Lx["nm"])
print("orbital mines -rivi %d listalle: %s" % (len(_om_log), ", ".join(_om_log)))
assert len(_om_log) >= 20, "orbital mines -riveja odotettiin ainakin 20, lisattiin %d" % len(_om_log)

# s.22 "When taken, they become an additional type of attack craft available to
# the carrier"; s.23 "Orbital mines completely replace all the attack craft in a
# ships launch bays" -> torpedo bomberit ja miinat eivat ole samalla aluksella
# (J21, Bug Hunt -loydos 1). Miinarivin oma noup sulkee toisen suunnan.
_tbx = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for e in s["ents"]:
            if e.get("k") == "up" and re.match(r"torpedo[\s-]*bom", str(e["l"]), re.I):
                _c = dict(e.get("cond") or {})
                _c["noup"] = (_c["noup"] + "|^orbital mines$") if _c.get("noup") else "^orbital mines$"
                e["cond"] = _c
                _tbx += 1
print("torpedo bombers -riveja, joille miinapoissulku: %d" % _tbx)
assert _tbx >= 20, "torpedo bombers -riveja odotettiin ainakin 20, loytyi %d" % _tbx

# s.234 Black Crusade: "Chaos Warmasters get one re-roll. In addition they may
# be given a single Mark of Chaos." Markkien hinnat ovat Chaos Lords -kohdan
# alla, ja rivien kohde (at) oli vain Lord (pistokoe 15 rivi 36). Warmaster
# lisataan kohteeksi; grp=mark pitaa Markin yhtena.
_wm = 0
for Lx in lists_out:
    if Lx["nm"] != "Chaos — Black Crusade":
        continue
    _wsi = [i for i, s in enumerate(Lx["secs"]) if s["t"] == "Chaos Warmaster"]
    assert len(_wsi) == 1, "Black Crusade: Chaos Warmaster -osio ei loydy"
    _wei = [i for i, e in enumerate(Lx["secs"][_wsi[0]]["ents"]) if e.get("k") == "cmd"]
    assert len(_wei) == 1, "Black Crusade: Warmaster-rivi ei loydy"
    for s in Lx["secs"]:
        if s["t"] != "Chaos Lords":
            continue
        for e in s["ents"]:
            if e.get("k") == "up" and str(e["l"]).startswith("The Mark of ") and e.get("at"):
                e["at"] = list(e["at"]) + [[_wsi[0], _wei[0]]]
                _wm += 1
assert _wm == 4, "Black Crusade: Warmasterin Mark-riveja odotettiin 4, loytyi %d" % _wm

# --- J161: Prince Yriel molemmille Corsair-listoille (s.319, 9.10.2026) ------
# "Yriel may be taken instead of the Hero Fleet Commander as listed in the
# Corsair and Craftworld Eldar fleet lists." Laatikko on painettu Iyandenin
# listan toiselle sivulle (s.319), joten poimija antoi rivin vain Iyandenille
# - pelaajaraportti 9.10.2026 ja kirjatarkistus 5.10. (J161). Rivit ja
# Yrielin omat lauseet KOPIOIDAAN Iyandenin osiosta, ei kirjoiteta uudestaan:
# yksi lahde, ja kopio perii kaiken mita aiemmat ajot riville antoivat (rr,
# ld, prose). Paikka on Corsair-listan oma RESERVES AND ALLIES -osio, sama
# kuin Iyandenissa; osio on olemassa, joten yksikaan osioindeksi ei siirry.
_YR_SRC = ("Yriel may be taken instead of the Hero Fleet Commander as listed in the "
           "Corsair and Craftworld Eldar fleet lists.")
_yiy = _p18_list("Eldar \u2014 Iyanden Craftworld")
_yis = _p18_sec(_yiy, "RESERVES AND ALLIES")
_ysec = _yiy["secs"][_yis]
assert [e["l"] for e in _ysec["ents"]] == ["Prince Yriel", "One extra re-roll", "Two extra re-rolls",
                                            "Embarked aboard the Flame of Asuryan"], [e["l"] for e in _ysec["ents"]]
assert _ysec["ents"][0]["k"] == "cmd" and _ysec["ents"][0]["p"] == 150 and _ysec["ents"][0].get("rr") == 1
assert all(e.get("at") == [[_yis, 0]] for e in _ysec["ents"][1:]), [e.get("at") for e in _ysec["ents"]]
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
assert len(_ytext) == 9 and _YR_SRC in _ytext, _ytext
# Kirjan lauseessa on painovirhe ("rules *eg you do not ... fleet list(."):
# tahti avaavan ja avaava sulje sulkevan sulkeen paikalla. Kortille ja
# laillisuusriville se korjataan luettavaksi; sanat ovat kirjan.
_YBAD = "*eg you do not have to field three capital ships in a Corsair Eldar fleet list(."
_YGOOD = "(e.g. you do not have to field three capital ships in a Corsair Eldar fleet list)."
_yfix = [i for i, t in enumerate(_ysec["text"]) if _YBAD in t]
assert len(_yfix) == 1, "Yriel: painovirhelause ei loydy tasan kerran (%d)" % len(_yfix)
_ysec["text"][_yfix[0]] = _ysec["text"][_yfix[0]].replace(_YBAD, _YGOOD)
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
_yex = [t for t in _ytext if "exempt from the reserve rules" in t]
_yab = [t for t in _ytext if "in which case his cost is 125 points" in t]
assert len(_yex) == 1 and len(_yab) == 1
# s.319: "He must be embarked aboard the Flame of Asuryan if it is present, in
# which case his cost is 125 points." Rivi -25 on rasti, jonka pelaaja voi
# unohtaa tai ottaa ilman alusta: resolveFleet vertaa (aboard).
_YR_ABOARD = dict(cmd_re="^prince yriel", ship_re="^flame of asuryan",
                  up_re="^embarked aboard the flame of asuryan", pg=319, src=_yab[0])
_yiy["aboard"] = dict(_YR_ABOARD)
_yn = [0, 0, 0]
for _nm in ("Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "RESERVES AND ALLIES")
    _s = _L["secs"][_si]
    assert not _s["ents"], "%s: RESERVES AND ALLIES -osiossa on jo riveja" % _nm
    _s["ents"] = [copy.deepcopy(e) for e in _ysec["ents"]]
    for _e in _s["ents"][1:]:
        _e["at"] = [[_si, 0]]
    _own = list(_s.get("own") or [None] * len(_s["text"]))
    assert len(_own) == len(_s["text"])
    _s["own"] = _own + ["Prince Yriel"] * len(_ytext)
    _s["text"] = list(_s["text"]) + list(_ytext)
    # Yriel on Heron tilalla: sama yksi komentajapaikka, ja han tayttaa
    # pakollisen komentajan (s.316/317 "a Pirate Prince must be included",
    # jonka Hero korvaa).
    for _x in _L["secs"]:
        for _r in _x.get("rules") or []:
            if _r.get("label") == "Fleet commander (Pirate Prince or Eldar Hero)":
                _r["label"] = "Fleet commander (Pirate Prince, Eldar Hero or Prince Yriel)"
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _r["src"] = _r["src"] + " " + _YR_SRC
                _yn[0] += 1
            elif _r.get("kind") == "mandatory_at" and "Pirate Prince must be included" in str(_r.get("src", "")):
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _yn[1] += 1
    # s.319: "Furthermore, if the Flame of Asuryan with Yriel is added to the
    # parent fleet it is exempt from the reserve rules *eg you do not have to
    # field three capital ships in a Corsair Eldar fleet list(." (kirjan oma
    # painovirhe sulkeissa). Vapautus koskee VAIN Flamea Yrielin kanssa: ei
    # Dragonshipia, ei Heron johtamaa laivastoa. Moottori: resolveFleet.
    # s.329: "It is a unique vessel, only one may ever be included in the
    # fleet." Lainatun rivin oma 0-1 ei laskeudu isantaan, joten raja on tassa.
    _L["res_exempt"] = dict(re="^flame of asuryan$", needs_re="^prince yriel", pg=319, src=_yex[0],
                            unique_src="It is a unique vessel, only one may ever be included in the fleet.", unique_pg=329)
    _L["aboard"] = dict(_YR_ABOARD)
    _yn[2] += 1
assert _yn == [2, 2, 2], _yn
print("Prince Yriel lisatty %d Corsair-listalle (s.319)" % _yn[2])

# s.319: RESERVES AND ALLIES -kappale (Corsair-reservit) ja Prince Yrielin
# laatikko ovat samassa osiossa. Omistajattomat lauseet naytettiin Yrielin
# kortilla, vaikka ne ovat kappaleen ("An Eldar Hero must lead the fleet in
# order to use Corsair Eldar vessels as reserves") tai laatikon kertomusta
# ("Unlike an Exarch ..."); pistokoe 15 rivi 59. ownx: ei kenenkaan kortille.
_yr = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"] != "RESERVES AND ALLIES" or not s.get("own"):
            continue
        if "Prince Yriel" not in s["own"]:
            continue
        for _i, _o in enumerate(s["own"]):
            if _o:
                continue
            s["own"][_i] = "RESERVES AND ALLIES"
            _ox = s.setdefault("ownx", [])
            if _i not in _ox:
                _ox.append(_i)
            _yr += 1
assert _yr >= 6, "Yriel: reservikappaleen lauseita odotettiin ainakin 6, loytyi %d" % _yr

# --- Pistokoe 19, J42: laivueiden kokoonpano (Fleets s.13) ------------------
# "A single escort may be taken in a fleet as long as there are no other
# escorts in the fleet and no other restrictions due to the fleet list, such
# as a minimum of six escorts in a squadron, these restrictions cannot be
# ignored." Poikkeus (lone) koskee listoja, joiden lause viittaa s.13:een
# ("in squadrons of 2-6 unless specified (see pg 13)"); oman kokonsa asettavat
# listat (Rogue Traders, Pirates, Necrons, Tyranidit, Tau Defenderit) eivat saa sita.
_lone = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") == "squadron" and re.search(r"see pg\.?\s*13", str(r.get("src", "")), re.I):
                r["lone"] = 1
                _lone += 1
assert _lone == 21, "s.13:een viittaavia laivuesaantoja odotettiin 21, loytyi %d" % _lone
# Armageddon s.43: "* Space Marine vessels may not be squadroned with
# non-Space Marine vessels." (split_fl). Tau s.455: "Defenders are fielded in
# squadrons of 2-6 ships. They may be combined in squadrons with Messengers if
# you wish. They may not be combined with Orcas." (with_pick).
_sq = 0
for Lx in lists_out:
    _titles = [x["t"].strip().lower() for x in Lx["secs"]]
    _txt = " ".join(t for x in Lx["secs"] for t in (x.get("text") or []))
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") != "squadron":
                continue
            if Lx["nm"] == "Imperial Navy — Armageddon Sector":
                assert "Space Marine vessels may not be squadroned with non-Space Marine vessels" in _txt
                r["split_fl"] = 1
                _sq += 1
            if Lx["nm"] in ("Tau — Merchant Fleet", "Tau — Commerce Protection") and \
                    str(r.get("src", "")).startswith("Defenders are fielded"):
                assert "They may be combined in squadrons with Messengers if you wish." in _txt
                assert _titles.count("escorts") == 1, Lx["nm"]
                r["with_pick"] = [dict(sec=_titles.index("escorts"), re="^messenger", _t="escorts")]
                _sq += 1
assert _sq == 3, "laivuelippuja (Armageddon + kaksi Tau-listaa) odotettiin 3, loytyi %d" % _sq

# --- Pistokoe 19, J45: Nate Montes -ehto (s.179) -----------------------------
# "Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated
# ships, and much more commonly seen outside of the Imperial Navy. If both
# players agree before the game, these ships can be included in a Rogue Trader
# fleet, as a cruiser and an escort respectively." Poiminta jatti osion
# tekstin tyhjaksi kaikilla kolmella RT-listalla, joten ehto ei nakynyt.
_NM_TXT = ("Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more "
           "commonly seen outside of the Imperial Navy. If both players agree before the game, these ships "
           "can be included in a Rogue Trader fleet, as a cruiser and an escort respectively.")
_NM_NOTE = "Only if both players agree before the game (Fleets p. 179)."
_nm = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"].strip().upper() != "NOTES FROM NATE MONTES":
            continue
        assert not s.get("text") and not s.get("own"), Lx["nm"]
        s["text"] = [_NM_TXT]
        for e in s["ents"]:
            if e.get("k") == "up":
                continue
            e["nt"] = (e["nt"] + " " + _NM_NOTE) if e.get("nt") else _NM_NOTE
            _nm += 1
assert _nm == 6, "Nate Montes -riveja odotettiin 6, loytyi %d" % _nm

# --- Pistokoe 19 kierros 2: listasaannot (M10r2) ------------------------------
def _p19_text(L, i):
    x = L["secs"][i]
    return " ".join(list(x.get("text") or []) + [r.get("src", "") for r in x.get("rules") or []])


# J55 s.456: "It may also include up to one Hero class starship for every other
# type of capital ship in the fleet." T18 (kayttajan paatos 11.9.): yksi Hero
# jokaista muuta aluslajia kohden; saman luokan konfiguraatiot ovat yksi laji
# (distinct). Pohja on listan omat Battleships- ja Cruisers-osiot.
# J56 s.457: "Up to one Rogue Trader cruiser and its attendant escorts may
# accompany the fleet for every 750 points of Tau ships in the fleet.
# Additionally, a single squadron of up to six Xenos escorts can be taken as per
# the Rogue Trader rules and fleet list." Laivueet 2-6 (RT s.174) ja laivueita
# enintaan risteilijoita + 1.
_CP = _p18_list("Tau — Commerce Protection")
_cpb, _cpc, _cpr = _p18_sec(_CP, "Battleships"), _p18_sec(_CP, "Cruisers"), _p18_sec(_CP, "Rogue Traders")
_HERO_SRC = "It may also include up to one Hero class starship for every other type of capital ship in the fleet."
assert "up to one Hero class starship for every other type of capital ship" in _p19_text(_CP, _cpc), "CP: Hero-lause puuttuu"
_CP["secs"][_cpc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True, distinct=1,
    label="Hero class starships (one per other type of capital ship)",
    allow_type="Hero class starships", per_type="other types of capital ship",
    allow_pick=[dict(sec=_cpc, re="^hero", _t="cruisers")],
    per_pick=[dict(sec=_cpb, _t="battleships"), dict(sec=_cpc, re="^(?!hero)", _t="cruisers")], src=_HERO_SRC))
_XE_SRC = ("Additionally, a single squadron of up to six Xenos escorts can be taken as per the Rogue Trader "
           "rules and fleet list.")
assert "a single squadron of up to six Xenos escorts" in _p19_text(_CP, _cpr), "CP: Xenos-lause puuttuu"
_CP_ESC = [dict(sec=_cpr, re="xenos|recommissioned|iconoclast|cargo", _t="rogue traders")]
_CP["secs"][_cpr].setdefault("rules", []).extend([
    dict(kind="squadron", min=2, max=6, ok=True, sec=[_cpr], pick=_CP_ESC,
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 "
             "points of Tau ships in the fleet. " + _XE_SRC),
    dict(kind="compare", op="<=", ok=True, a_units=1, b_add=1,
         label="Rogue Trader escort squadrons (one per Rogue Trader cruiser, plus one Xenos squadron)",
         a_pick=_CP_ESC, b_pick=[dict(sec=_cpr, re="rogue trader cruiser|dauntless|endeavour", _t="rogue traders")],
         src=_XE_SRC)])

# J57 s.487: "For every three Demiurg capital ships in the fleet, it may include
# one squadron of up to six Tau or Rogue Trader escorts." ja "Tau, Nicassar and
# Rogue Trader escorts may not be mixed in the same squadrons." Lista ei aseta
# vahimmaiskokoa, joten s.13:n yksittaisen saattajan poikkeus patee (lone).
_WH = _p18_list("Demiurg — War Host")
_DW_SRC = ("For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau "
           "or Rogue Trader escorts.")
assert any(_DW_SRC in _p19_text(_WH, i) for i in range(len(_WH["secs"]))), "War Host: saattajalause puuttuu"
for _t in ("Tau Escorts", "Rogue Trader Escorts"):
    _i = _p18_sec(_WH, _t)
    _WH["secs"][_i].setdefault("rules", []).append(dict(
        kind="squadron", min=2, max=6, lone=1, ok=True, sec=[_i],
        src=_DW_SRC + " Tau, Nicassar and Rogue Trader escorts may not be mixed in the same squadrons."))

# J61 s.177: pakollinen cargo-laivue "in a squadron of 2 to 6 ships" ja "Any
# number of cargo ships beyond this number may be taken and organized in
# squadrons that only contain cargo ships."
_EX = _p18_list("Rogue Traders — Exploration")
_ext, _exe = _p18_sec(_EX, "TRANSPORTS"), _p18_sec(_EX, "ESCORTS")
_cs = [r["src"] for r in _EX["secs"][_ext].get("rules") or [] if r.get("label") == "Cargo ship squadron"]
assert len(_cs) == 1, "Exploration: cargo-saanto ei loydy tasan kerran"
_EX["secs"][_ext]["rules"].append(dict(
    kind="squadron", min=2, max=6, ok=True, sec=[_ext],
    pick=[dict(sec=_ext, re="cargo|freighter|q-ship|escort carrier", _t="transports"),
          dict(sec=_exe, re="cargo vessel", _t="escorts")],
    src=_cs[0] + " Any number of cargo ships beyond this number may be taken and organized in squadrons "
                 "that only contain cargo ships."))

# J62 s.372: "Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired"
_CZ = _p18_list("Orks — Da Ork Clanz")
_tz = _p18_sec(_CZ, "Tiddla skwadron")
assert not _CZ["secs"][_tz].get("rules"), "Clanz: tiddla-osiolla on jo saanto"
_CZ["secs"][_tz]["rules"] = [dict(kind="squadron", min=3, max=10, ok=True, sec=[_tz],
                                  src="Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired")]

# J63 s.318: "an Autarch must be included to lead it. Eldar Autarch (Ld 9) ...
# Iyanden Bearer of the Flame (Ld 10)" - Dragonship-poikkeus ("If your fleet is
# led by an Autarch") koskee koko Autarch-osiota, ei vain nimea, jossa sana on.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_ia = _p18_sec(_IY, "Autarch")
assert any("Bearer of the Flame" in e["l"] for e in _IY["secs"][_ia]["ents"]), "Iyanden: Bearer puuttuu"
_iy = 0
for x in _IY["secs"]:
    for r in x.get("rules") or []:
        ex = r.get("exempt") or {}
        if any(p.get("re") == "autarch" for p in ex.get("cond_pick") or []):
            ex["cond_pick"] = [dict(sec=_ia, _t="autarch")]
            _iy += 1
assert _iy == 1, "Iyanden: Autarch-poikkeuksia odotettiin 1, loytyi %d" % _iy

# J64 ja J65 s.431: "Up to 10 % of the fleet's points allowance may be spent on
# Ordnance markers as long as at least one hive ship is chosen." Merkit ovat
# aluksille ostettavia paivityksia (up_sec). "You may include between 6 and 12
# escort class ships for each hive ship. If no hive ships are chosen, only
# Kraken and Vanguard drone ships may be included in the fleet." Ylaraja koskee
# vain laivastoa, jossa on hive ship (when_pick).
_HF = _p18_list("Tyranids — Hive Fleet")
_hs, _ho = _p18_sec(_HF, "HIVE SHIPS"), _p18_sec(_HF, "ORDNANCE")
_hf = 0
for x in _HF["secs"]:
    for r in x.get("rules") or []:
        if r.get("kind") == "points_share" and str(r.get("label", "")).startswith("Ordnance markers"):
            r["up_sec"] = _ho
            _hf += 1
        if r.get("label") == "Escorts per hive ship (max)":
            r["when_pick"] = [dict(sec=_hs, _t="hive ships")]
            _hf += 1
assert _hf == 2, "Hive Fleet: ordnance- ja saattajasaantoja odotettiin 2, loytyi %d" % _hf

# --- Pistokoe 19 kierros 3 (M10r3) --------------------------------------------
# J70 s.177: "At least one Demiurg vessel of any class may be taken for every
# three Rogue Trader cruisers in the fleet. This is separate from and in addition
# to any reserve or allied cruisers taken, but each Demiurg vessel taken still
# counts against the twelve-cruiser limit, and no more than one Stronghold may be
# taken." "At least one" luetaan valjasti (T20): yksi heti ensimmaisesta
# risteilijasta, sitten yksi kolmea kohden (min_one); pohja on listan omat
# kapitaalialukset ja Siluria.
_exd, _exc, _exn = _p18_sec(_EX, "The Demiurg"), _p18_sec(_EX, "CAPITAL SHIPS"), _p18_sec(_EX, "NOTES FROM NATE MONTES")
assert not _EX["secs"][_exd].get("rules"), "Exploration: Demiurg-osiolla on jo saanto"
assert "At least one Demiurg vessel of any class may be taken" in _p19_text(_EX, _exd)
_EX["secs"][_exd]["rules"] = [dict(
    kind="ratio", allow=1, per=3, min_one=1, ok=True, label="Demiurg vessels (one per three Rogue Trader cruisers)",
    # T20 on avoin tulkinta (kayttaja 11.9.2026): valja luenta sallitaan, mutta
    # tarkistus varoittaa, kun tiukka luenta ("one for every three") ei tayty.
    interp=dict(id="T20", strict="min_one",
                note="Open interpretation: \"At least one Demiurg vessel of any class may be taken for every three "
                     "Rogue Trader cruisers in the fleet\" (Fleets p. 177) can also be read as one per full three "
                     "cruisers, which allows none with one or two. The app allows one; agree with your opponent."),
    allow_type="Demiurg vessels", per_type="Rogue Trader cruisers",
    allow_pick=[dict(sec=_exd, _t="the demiurg")],
    per_pick=[dict(sec=_exc, _t="capital ships"), dict(sec=_exn, re="^siluria", _t="notes from nate montes")],
    src="At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet.")]

# J71 s.370: "A vessel or escort skwadron led by a Warlord may be given up to one
# of the following upgrades per Command re-roll the Warlord has. Each upgrade can
# only be applied once." Warlordilla on yksi re-roll ja se voi ostaa yhden tai
# kaksi lisaa (s.372). Sidontaa ei mallinneta (J8), joten laivastotasolla:
# Gubbinseja enintaan Warlordien re-rollien summa (up_budget).
_czg, _czw = _p18_sec(_CZ, "GUBBINS"), _p18_sec(_CZ, "WARLORD")
_CZ["secs"][_czg].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_czg, label="Gubbins (one per Warlord re-roll)",
    # s.371 MORE GUBBINS: "The following gubbins can be taken by any number of
    # capital ships in the fleet" - ne eivat kuluta re-roll-budjettia (T31).
    up_re=r"^(?!Klaws|Shokk-Attack Lance|Assault Karrier)",
    budget=[dict(pick=[dict(sec=_czw, _t="warlord")], units=1),
            dict(up_sec=_czw, up_re="^One extra re-roll", weight=1),
            dict(up_sec=_czw, up_re="^Two extra re-rolls", weight=2)],
    src="A vessel or escort skwadron led by a Warlord may be given up to one of the following upgrades per "
        "Command re-roll the Warlord has. Each upgrade can only be applied once."))

# J72 s.100: "Any Imperial Navy battleship, grand cruiser or battlecruiser may
# have a Space Marine Captain assigned to it." Listalla ei ole Imperial Navy
# -runkoja (reservit ovat vain tekstina, J73), joten Captainille ei ole alusta.
_DM = _p18_list("Space Marines — Dominion")
_dmc = _p18_sec(_DM, "Space Marine Captains")
_DM["secs"][_dmc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True,
    label="Space Marine Captains (one per Imperial Navy battleship, grand cruiser or battlecruiser)",
    allow_type="Space Marine Captains", per_type="Imperial Navy battleships, grand cruisers or battlecruisers",
    allow_pick=[dict(sec=_dmc, re="^space marine captain", _t="space marine captains")], per_pick=[],
    src="Any Imperial Navy battleship, grand cruiser or battlecruiser may have a Space Marine Captain assigned to it."))

# J78 s.40: "As long as at least one Space Marine Battle barge is included you may
# choose a Master of the Fleet, who will always be assigned to a Battle barge and
# cannot be assigned to a non-Space Marine ship. As long as the fleet includes at
# least one Imperial capital ship it may include a fleet-admiral, admiral or solar
# admiral, who will always be assigned to an Imperial Navy vessel and cannot be a
# assigned to a Space Marine vessel." Sidontaa ei mallinneta (J8), ehto kylla.
_AR = _p18_list("Imperial Navy — Armageddon Sector")
_arf, _arb, _arbc, _arc = [_p18_sec(_AR, _t) for _t in ("Fleet Commander", "Battleships", "Battlecruisers", "Cruisers")]
assert "As long as at least one Space Marine" in " ".join(_p19_text(_AR, _i) for _i in range(len(_AR["secs"]))), \
    "Armageddon: komentajalause puuttuu"
_AR["secs"][_arf].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Master of the Fleet needs a Space Marine battle barge",
         if_pick=[dict(sec=_arf, re="^master of the fleet", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="space marine battle barge", _t="battleships")], min=1,
         src="As long as at least one Space Marine Battle barge is included you may choose a Master of the Fleet, "
             "who will always be assigned to a Battle barge and cannot be assigned to a non-Space Marine ship."),
    dict(kind="requires", ok=True, label="Admiral needs an Imperial capital ship",
         if_pick=[dict(sec=_arf, re="admiral", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="^(?!space marine)", _t="battleships"), dict(sec=_arbc, _t="battlecruisers"),
                    dict(sec=_arc, re="^(?!space marine)", _t="cruisers")], min=1,
         src="As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, "
             "admiral or solar admiral, who will always be assigned to an Imperial Navy vessel and cannot be a "
             "assigned to a Space Marine vessel.")])

# J81 s.234/236/240/244/248: "You can only include a Chaos Warmaster in your fleet
# if it includes any capital ships." Kapitaalialuksiksi luetaan Planet Killer, Chaos
# Space Hulk (s.288 "counts as a battleship"), taistelulaivat, grand ja heavy
# cruiserit, cruiserit seka Activated Blackstone Fortress (valja luenta).
_WM_SRC = "You can only include a Chaos Warmaster in your fleet if it includes any capital ships."
_WM_CAP = ("planet killer", "chaos space hulk", "battleships", "grand cruisers", "heavy cruisers", "cruisers",
           "activated blackstone fortress")
_wm = 0
for _L in lists_out:
    if not _L["nm"].startswith("Chaos — "):
        continue
    _hit = [i for i in range(len(_L["secs"])) if _WM_SRC in _p19_text(_L, i)]
    if not _hit:
        continue
    _i = _hit[0]
    _tt = [x["t"].strip().lower() for x in _L["secs"]]
    _caps = [j for j, t in enumerate(_tt) if t in _WM_CAP]
    assert len(_caps) == len(_WM_CAP), (_L["nm"], _caps)
    _L["secs"][_i].setdefault("rules", []).append(dict(
        kind="requires", ok=True, label="Chaos Warmaster needs a capital ship",
        if_pick=[dict(sec=_i, re="^chaos warmaster", _t=_tt[_i])],
        then_pick=[dict(sec=j, _t=_tt[j]) for j in _caps], min=1, src=_WM_SRC))
    _wm += 1
assert _wm == 5, "Chaos Warmaster -lauseita odotettiin 5, loytyi %d" % _wm

# J82 s.140: "If desired, vessels with an embarking Inquisitor may gain special
# characteristics, depending upon the Ordo the Inquisitor leading the fleet is
# affiliated with." ja "The listed cost is added to that of the Inquisitor Lord".
# Ordo on johtavan Inquisitor Lordin lisa: se vaatii Lordin, ja Ordoja on yksi.
_IQ = _p18_list("The Emperor's Inquisition")
_iql, _iqc = _p18_sec(_IQ, "Inquisitor Lord"), _p18_sec(_IQ, "CAPITAL SHIPS")
_iqo = [_p18_sec(_IQ, _t) for _t in ("ORDO HERETICUS INQUISITORS", "ORDO XENOS INQUISITORS", "ORDO MALLEUS INQUISITORS")]
_ORDO_SRC = "The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon."
_ORDO_AFF = ("If desired, vessels with an embarking Inquisitor may gain special characteristics, depending upon "
             "the Ordo the Inquisitor leading the fleet is affiliated with.")
_iqs = _p18_sec(_IQ, "INQUISITORS OF THE ORDOS")
assert _ORDO_AFF in _p19_text(_IQ, _iqs), "Inquisition: Ordo-lause puuttuu"
# Poiminta pudotti s.140:n hintalauseen osion tekstista; se kuuluu lukijalle nakyviin.
assert _ORDO_SRC not in _p19_text(_IQ, _iqs)
_IQ["secs"][_iqs]["text"].append(_ORDO_SRC)
_ordo_pick = [dict(sec=i, re="inquisitor lord", _t=_IQ["secs"][i]["t"].strip().lower()) for i in _iqo]
_IQ["secs"][_iqo[0]].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Ordo Inquisitor needs an Inquisitor Lord",
         if_pick=_ordo_pick, then_pick=[dict(sec=_iql, re="^inquisitor lord", _t="inquisitor lord")], min=1,
         src=_ORDO_SRC),
    dict(kind="cap", ok=True, max=1, what="Ordo affiliations", label="Ordo affiliation (one Ordo)", pick=_ordo_pick,
         src=_ORDO_AFF)])

# J83 s.138: "A Space Marine fleet led by an Ordo Malleus Inquisitor including at
# least 1000 points of Inquisition vessels and Grey Knights strike cruisers may
# include a single Grey Knights battle barge." Barge itse ei kuulu 1 000 pisteeseen
# (T22). "Space Marine fleet" -ehtoa ei voi tarkistaa: lista liitetaan isantaan.
_GKB_SRC = ("A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition "
            "vessels and Grey Knights strike cruisers may include a single Grey Knights battle barge.")
assert "may include a single Grey Knights" in _p19_text(_IQ, _iqc), "Inquisition: Battle barge -lause puuttuu"
_gkb = [dict(sec=_iqc, re="^grey knights battle barge", _t="capital ships")]
_IQ["secs"][_iqc].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Grey Knights Battle barge needs an Ordo Malleus Inquisitor",
         if_pick=_gkb, then_pick=[dict(sec=_iqo[2], re="inquisitor lord", _t="ordo malleus inquisitors")], min=1,
         src=_GKB_SRC),
    dict(kind="per_points", ok=True, each=1, per=1000, full=True, what="Grey Knights Battle barge",
         label="Grey Knights Battle barge (1000 points of Inquisition vessels and Grey Knights strike cruisers)",
         pick=_gkb, of_pick=[dict(sec=_iqc, re="^(?!grey knights battle barge)", _t="capital ships")], src=_GKB_SRC)])

# J84 s.174: "Any fleet except Necrons or Tyranids may include a single Rogue Trader
# capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser
# for every 750 points or part thereof in their fleet." Isantalaivastoa ei tiedeta,
# joten valja raja: yksi risteilija 750 pistetta tai sen osaa kohden (T23). Heavy
# transportit ovat kuljetuksia (niita saa laivueina), eivat risteilijoita.
_RTL = _p18_list("Rogue Traders")
_rtc, _rtn = _p18_sec(_RTL, "CAPITAL SHIPS"), _p18_sec(_RTL, "NOTES FROM NATE MONTES")
_RTC_SRC = ("Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. Tau, Demiurg and "
            "Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet.")
assert "may include a single Rogue Trader capital ship" in _p19_text(_RTL, _rtc), "Rogue Traders: lause puuttuu"
_RTL["secs"][_rtc].setdefault("rules", []).append(dict(
    kind="per_points", ok=True, each=1, per=750, what="Rogue Trader cruiser",
    label="Rogue Trader cruisers (one per 750 points or part)",
    # T23 on avoin tulkinta (kayttaja 11.9.2026).
    interp=dict(id="T23", strict_max=1,
                note="Open interpretation: any fleet may include \"a single Rogue Trader capital ship\"; only Tau, "
                     "Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points (Fleets "
                     "p. 174). The app does not know the fleet you join and allows the larger number."),
    pick=[dict(sec=_rtc, re="rogue trader cruiser|dauntless|endeavour", _t="capital ships"),
          dict(sec=_rtn, re="^siluria", _t="notes from nate montes")], src=_RTC_SRC))

# J44 s.175: "To represent this each Rogue Trader cruiser and escort squadron may
# roll one random crew skill on [???] in the Remastered Rulebook for +10% point
# value." Taulukko on Rulebook s.159 (CREW SKILLS). Hinta = 10 % yksikon pisteista
# ennen crew skillia, ylospain (T27). p=None: app_template nayttaa "see text", ja
# domain laskee hinnan kentasta pct (ei app_template-muutosta, kayttaja 11.9.).
_rtb = _p18_sec(_RTL, "THE BEST MONEY CAN BUY")
_CS_SRC = ("To represent this each Rogue Trader cruiser and escort squadron may roll one random crew skill on [???] "
           "in the Remastered Rulebook for +10% point value.")
assert _CS_SRC in _p19_text(_RTL, _rtb), "Rogue Traders: crew skill -lause puuttuu"
_rtbe = _RTL["secs"][_rtb]["ents"]
_xc = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (cruiser)"]
_xe = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (escort, per ship)"]
assert len(_xc) == 1 and len(_xe) == 1 and not any(e["l"].startswith("Crew skill") for e in _rtbe)
_CS_DESC = ("Roll D6 on the Crew Skills table (Rulebook p. 159) before the game and note the result. Cost: +10% of the "
            "unit's points (hull, options and refits), rounded up. (Fleets p. 175)")
_rtbe.extend([
    dict(l="Crew skill, rolled randomly (cruiser, +10% of its points)", r=None, p=None, pct=10, a=1, u=1, mx=None,
         nt=None, prose=1, k="up", cond=dict(_xc[0]["cond"]), desc=_CS_DESC, src_page=175),
    # Crew skill ei ole refit, joten Fast Clipperin "Instead of taking a refit" ei koske sita.
    dict(l="Crew skill, rolled randomly (escort squadron, +10% of its points)", r=None, p=None, pct=10, a=1, u=1,
         mx=None, nt=None, prose=1, k="up",
         cond={k: v for k, v in _xe[0]["cond"].items() if k != "offopt"}, desc=_CS_DESC, src_page=175)])

# J86 s.233, 235, 237 ORDNANCE: "Ships with torpedo tubes are armed with normal and
# boarding torpedoes." Poiminta pudotti lauseen kolmelta listalta. Nurglen, Khornen
# ja Slaaneshin sivuilla (241, 245, 249) kappale katkeaa itse kirjassa ennen
# lausetta (T25, kysytaan kayttajalta).
_CT_SRC = "Ships with torpedo tubes are armed with normal and boarding torpedoes."
for _nm in ("Chaos — Incursion", "Chaos — Black Crusade", "Chaos — Tzeentch"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays") and not any("torpedo tubes" in t for t in _tx), _nm
    _tx.insert(1, _CT_SRC)
# T25 (kayttajan paatos 11.9.2026): Nurglen, Khornen ja Slaaneshin kappale katkeaa
# kirjassa (s.241 "Ships with torpedo", s.245 ja 249 "can have a mixture"; sivukuvat).
# Taydennetaan rinnakkaisten listojen lauseilla (s.235) ja kerrotaan se lukijalle.
_CL_SRC = ("Ships with launch bays can have a mixture of Swiftdeath fighters, Doomfire bombers and Dreadclaw "
           "assault craft.")
for _nm in ("Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays can have a mixture"), _nm
    assert not any("torpedo tubes" in t for t in _tx), _nm
    _tx[0] = _CL_SRC
    _tx.insert(1, _CT_SRC)
    _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("notes", []).append(
        "The paragraph breaks off in the book; completed from the other Chaos fleet lists, Fleets p. 235.")

# v1.1-puutteet nakyviin (kayttaja 11.9.2026): saannot, joita sovellus ei viela
# valvo, naytetaan laivaston tarkistuksissa varoituksena (kind "notice").
_HOOK_LBL = "Gravitic hook capacity (Orcas, Wardens, Dhows): check by hand"
# War Hostin lause katkeaa kirjassa kesken ("...for every starship in the fleet
# equipped with gravitic hooks" ilman lukua), joten siella kapasiteettia ei voi
# valvoa keksimatta lukua. Tau-listoilla lause on kokonainen -> J95.
# J213 (kayttaja 20.10.2026: "toteuta kaikki"): luku puuttuu yha, joten saanto
# luetaan Tau-listojen tapaan (s.454-457: koukkukapasiteetin verran) ja
# ylitys naytetaan keltaisena, ei punaisena - avoin tulkinta T50.
_WH_HOOK = "Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks."
_L = _p18_list("Demiurg — War Host")
_whe = _p18_sec(_L, "ESCORTS")
assert _WH_HOOK in _L["secs"][_whe].get("text", []), "War Host: koukkulause puuttuu ESCORTS-osiosta"
_L["secs"][_whe].setdefault("rules", []).append(dict(
    kind="hook_capacity", ok=True, soft=True, label="Gravitic hook capacity (Orcas, Wardens and Dhows)",
    carry=[dict(sec=_p18_sec(_L, "Tau Escorts"), re="^(orca|warden)"),
           dict(sec=_p18_sec(_L, "Nicassar Escorts"), re="dhow")],
    caps=[0, 1, 2], src=_WH_HOOK,
    interp=dict(id="T50", note="Open interpretation: the War Host sentence (Fleets p. 487) gives no number. The app "
                "reads it as the Tau lists do (pp. 454-457): no more Orcas, Wardens and Dhows than the fleet's "
                "gravitic hook capacity, and shows going over it as a warning, not an error.")))

# J95 s.454/456: "You may not have more Orcas and Wardens than the gravitic hook
# capacity of the fleet." s.455/457: "You may not have more Dhows (or Orcas) than
# the gravitic hook capacity of the fleet." ja s.457 lisaksi: "Gravitic hooks on a
# Custodian battleship or Emissary starship cannot count toward this total."
# Kapasiteetti luetaan profiilista: koukkurivi kertoo itse mita se kantaa.
_HOOK_CAP_RX = re.compile(r"capacity:\s*(\d+)", re.I)
_hk = 0
for _sh in ships.values():
    _any = _wrd = _dhw = 0
    for _a in (_sh.get("aw") or []):
        if "ravitic hook" not in str(_a[0]).lower():
            continue
        _txt = " ".join(str(_x) for _x in _a).lower()
        _m = _HOOK_CAP_RX.search(_txt)
        _n = int(_m.group(1)) if _m else 1
        if "orca" in _txt and "warden" in _txt:
            _any += _n
        elif "warden" in _txt:
            _wrd += _n
        elif "dhow" in _txt:
            _dhw += _n
        else:
            _any += _n
    if _any or _wrd or _dhw:
        _sh["hk"] = [_any, _wrd, _dhw]
        _hk += 1
assert _hk == 11, "gravitic hook -runkoja odotettiin 11, loytyi %d" % _hk

_HOOK_A = "You may not have more Orcas and Wardens than the gravitic hook capacity of the fleet."
_HOOK_B = {
    "Tau — Merchant Fleet":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. A ship may have "
        "either Orcas or Dhows, but not both so the gravitic hook capacity of the fleet is divided between Orcas "
        "and Dhows.",
    "Tau — Commerce Protection":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. Gravitic hooks on a "
        "Custodian battleship or Emissary starship cannot count toward this total.",
}
for _nm, _srcB in _HOOK_B.items():
    _L = _p18_list(_nm)
    _e, _nv = _p18_sec(_L, "ESCORTS"), _p18_sec(_L, "Nicassar Vessels")
    _L["secs"][_e].setdefault("rules", []).extend([
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Orcas and Wardens)",
             carry=[dict(sec=_e, re="^(orca|warden)", _t="escorts")], caps=[0, 1], src=_HOOK_A),
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Dhows and Orcas)",
             carry=[dict(sec=_e, re="^orca", _t="escorts"),
                    dict(sec=_nv, re="dhow", _t="nicassar vessels")], caps=[0, 2], src=_srcB)])
# J92:n huomautus Dominionin reserveista poistettiin 14.9.2026 (J106): reservit
# ovat nyt moottorissa (nimetty lupa res_ok + kahdentoista risteilijan katto),
# joten "ei viela sovelluksessa" olisi vaara tieto. Kirjan lause jaa nakyviin
# osion tekstina.

# J88 s.236: "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be
# granted a Strand of Fortune." Sidontaa ei mallinneta (J8): Strandeja enintaan
# Chaos Lordien maara.
_TZ = _p18_list("Chaos — Tzeentch")
_tzf, _tzl = _p18_sec(_TZ, "FORCES OF CHAOS"), _p18_sec(_TZ, "Chaos Lords")
_ST_SRC = "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be granted a Strand of Fortune."
_TZ["secs"][_tzf].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_tzf, up_re="^Strand of Fortune", label="Strand of Fortune (one per Chaos Lord)",
    budget=[dict(pick=[dict(sec=_tzl, re="^chaos lord", _t="chaos lords")], units=1)], src=_ST_SRC))

# J89 s.318: "In order to take the Flame of Asuryan, an Eldar Hero must lead the
# fleet and be embarked aboard it." s.319 Yriel, Bearer of the Flame: "you may
# instead pick the Flame of Asuryan as his command ship to be embarked on."
_IY = _p18_list("Eldar — Iyanden Craftworld")
_iyd, _iyh, _iya = _p18_sec(_IY, "Dragonships"), _p18_sec(_IY, "Eldar Hero"), _p18_sec(_IY, "Autarch")
_FA_SRC = "In order to take the Flame of Asuryan, an Eldar Hero must lead the fleet and be embarked aboard it."
assert "an Eldar Hero must lead the" in _p19_text(_IY, _iyd), "Iyanden: Flame-lause puuttuu"
_IY["secs"][_iyd].setdefault("rules", []).append(dict(
    kind="requires", ok=True, label="Flame of Asuryan needs an Eldar Hero (or Yriel)",
    if_pick=[dict(sec=_iyd, re="^flame of asuryan", _t="dragonships")],
    # Yriel on RESERVES AND ALLIES -osion rivi (s.319): ilman tata poimintaa
    # saanto nimesi hanet otsikossaan mutta hylkasi Yriel + Flame -laivaston.
    then_pick=[dict(sec=_iyh, re="^eldar hero", _t="eldar hero"),
               dict(sec=_iya, re="bearer of the flame", _t="autarch"),
               dict(sec=_p18_sec(_IY, "RESERVES AND ALLIES"), re="^prince yriel", _t="reserves and allies")], min=1,
    src=_FA_SRC + " Yriel (Fleets p. 319): \"you may instead pick the Flame of Asuryan as his command ship\"."))

# J66 s.144: "If the fleet is above 750 points an Inquisitor Lord must lead the
# fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must be
# placed aboard it." Laivastoa johtaa yksi Inquisitor Lord (T19).
_GK = _p18_list("Grey Knights")
_gc = _p18_sec(_GK, "FLEET COMMANDER")
_GK["secs"][_gc].setdefault("rules", []).append(dict(
    kind="section_count", min=0, max=1, ok=True, sec=[_gc], label="Fleet commander (one Inquisitor Lord)",
    src="If the fleet is above 750 points an Inquisitor Lord must lead the fleet. If an Inquisitorial Cruiser "
        "is present the Inquisitor Lord must be placed aboard it."))





# --- 1.1 vaihe 4: Inquisition isantalaivastoon (Fleets s.138) ---------------
# "The Inquisition has no fleet list on its own. Instead, there are various
# ways to add an Inquisitor or Inquisitorial ships to the Imperial factions."
#
# Sovelluksessa Inquisition on oma listansa (tallenteet ja kortit toimivat,
# paatos T29), mutta kirjan mukainen tapa on liittaa se isantalaivastoon.
# Tama lisaa liiteosion kahdeksalle listalle, jotka kirja nimeaa: "any
# Imperial Navy, Space Marine or Adeptus Mechanicus fleet".
#
# Grey Knights Battle barge EI ole mukana: se vaatii Ordo Malleus
# -inkvisiittorin (s.138, s.145), jota naiden listojen komentajaosioissa ei
# ole. Se pysyy Grey Knights -listalla, jossa ehto on mallinnettu (J83).
_INQ_LORD = ("Any Imperial or Space Marine fleet 750 points or greater may be "
             "led by an Inquisitor Lord.")
_INQ_CRUISER = ("Any Imperial or Space Marine fleet may include a single "
                "Inquisitorial Cruiser in the fleet, which takes the place of a "
                "battlecruiser or strike cruiser in the fleet.")
_INQ_BLACK = ("A fleet may include a single Blackship, which as a special "
              "vessel does not count toward or against other ship limits in the "
              "fleet.")
_INQ_GK = ("If an Inquisitor Lord is leading the fleet, up to one Grey Knights "
           "Strike Cruiser may be taken for every 500 points in the fleet.")
_INQ_INTRO = ("A single Inquisitorial cruiser led by an Inquisitor can be taken "
              "as reserves by any Imperial Navy, Space Marine or Adeptus "
              "Mechanicus fleet; or an Inquisitor and his retinue may be "
              "embarked on a single Rogue Trader cruiser.")
_INQ_RR = ("An Inquisitor Lord gets one re-roll, which may be used for any ship in "
           "the fleet.")
_INQ_RR2 = "A second re-roll can be purchased for +25 points."
# J148 (kayttajaraportti 25.9.): Inquisitorial Cruiser "takes the place of a
# battlecruiser or strike cruiser in the fleet" (s.138), ja Blackship on ainoa
# Inquisition-alus, joka "does not count toward or against other ship limits"
# - poikkeus olisi tyhja, elleivat muut laskisi. Grey Knights Strike Cruiser
# on risteilija, ja s.14: "the restrictions on maximum and minimum numbers of
# ships are determined for the fleet as a whole, regardless of whether they
# were purchased from the list or as reserves". Liiteosion rivit eivat
# muuten laske isannan rajoihin lainkaan (matches() laskee oman rivin vain
# omassa osiossaan), joten poiminnat lisataan kuten renegaateilla (J141) ja
# Ordo Malleus -reserveilla (J144).
_INQ_CRU_RE = "^inquisitorial cruiser"
_INQ_GKSC_RE = "^grey knights strike cruiser"
def _inq_limits(L, inq):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers") if "cruisers" in t else None
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            _cap = _r.get("max") if _r["kind"] == "section_count" else (
                _r.get("max_unmet") if _r["kind"] == "conditional_cap" else None)
            if cru is not None and _r.get("sec") == [cru] and _cap in (10, 12):
                # Imperial Navy 0-12: GK strike cruiser on risteilija, Inquisitorial
                # Cruiser taas taisteluristeilija eika laske tahan. Space Marine
                # 0-10 Cruisers: molemmat vievat strike cruiserin paikan.
                add = [dict(sec=inq, re=_INQ_GKSC_RE)]
                if _cap == 10:
                    add.append(dict(sec=inq, re=_INQ_CRU_RE))
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + add
                hits.append("cru%d" % _cap)
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if cru is None or not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                # "one battlecruiser for every two cruisers": Inquisitorial Cruiser
                # vie taisteluristeilijan paikan, GK strike cruiser on pohjan risteilija.
                _r["allow_pick"] = allow + [dict(sec=inq, re=_INQ_CRU_RE)]
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE)]
                hits.append("bc")
            else:
                # "one battleship for every three cruisers or battlecruisers":
                # molemmat laskevat pohjaan.
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE), dict(sec=inq, re=_INQ_CRU_RE)]
                hits.append("bs")
    return sorted(hits)
_INQ_HOSTS = ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Bastion Fleets",
              "Imperial Navy \u2014 Armageddon Sector", "Imperial Navy \u2014 Bakka Sector",
              "Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Crusade",
              "Space Marines \u2014 Dominion", "Adeptus Mechanicus \u2014 Explorator")
_inq_n = 0
_inq_at = {}
for _nm in _INQ_HOSTS:
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 150 for x in _L["secs"] for e in x["ents"]), \
        "%s: Inquisitorial Cruiser on jo" % _nm
    # Isannan oma KOMENTAJAosio on se, jota komentajapakko koskee - ei mika
    # tahansa osio jossa on k="cmd" -rivi (Bastion Fleetsilla myos Veteran
    # Captains on sellainen, mutta se on aluskohtainen paivitys).
    _cmds = set()
    for _x in _L["secs"]:
        for _r in (_x.get("rules") or []):
            if _r.get("kind") != "mandatory_at":
                continue
            for _q in (_r.get("pick") or []):
                _cmds.add(_q["sec"])
            for _j in (_r.get("sec") or []):
                _cmds.add(_j)
    _cmds = [i for i in sorted(_cmds)
             if any(e.get("k") == "cmd" for e in _L["secs"][i]["ents"])]
    assert len(_cmds) == 1, "%s: komentajaosioita %s" % (_nm, _cmds)
    _cmd = _cmds[0]
    _i = len(_L["secs"])
    _ents = [
        dict(l="Inquisitor Lord (Ld 9)", r=None, p=75, src_page=138, a=1, mx=1,
             nt=None, k="cmd", ld=dict(kind="fixed", value=9), rr=1),
        _p18_unit("Inquisitorial Cruiser", 150, 270, 138, mx=1),
        _p18_unit("Inquisition Blackship", 148, 300, 138, mx=1),
        _p18_unit("Grey Knights Strike Cruiser", 151, 165, 138),
        # s.138: "A second re-roll can be purchased for +25 points." Sama rivi
        # kuin Inquisition-listalla; kohteena Lordin rivi (indeksi 0). Loppuun,
        # jotta vanhojen tallenteiden rivit pitavat indeksinsa.
        dict(l="One extra re-roll", r=None, p=25, src_page=138, a=1, u=1, mx=None,
             nt=None, prose=1, k="up", grp="rr", at=[[_i, 0]], rr=1),
    ]
    _rules = [
        dict(kind="allowed_at", points=750, ok=True, sec=[_i],
             label="Inquisitor Lord (from 750 pts)",
             pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_LORD),
        dict(kind="per_points", each=1, per=500, ok=True, sec=[_i],
             label="Grey Knights Strike Cruisers (one per 500 pts, with an Inquisitor Lord)",
             pick=[dict(sec=_i, re="^grey knights strike cruiser")],
             cond_pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_GK),
        # Inquisitor Lord JOHTAA laivastoa, joten hanta ei oteta laivaston oman
        # komentajan lisaksi vaan sijaan - sama rakenne kuin Eldar Herolla
        # (s.316, cap-saanto kahden osion yli).
        dict(kind="cap", max=1, ok=True, sec=[_i],
             label="Fleet commander (the list's own or an Inquisitor Lord)",
             pick=[dict(sec=_cmd), dict(sec=_i, re="^inquisitor lord")],
             src=_INQ_LORD),
    ]
    _L["secs"].append(dict(t="THE INQUISITION", text=[_INQ_INTRO, _INQ_CRUISER,
                                                      _INQ_BLACK, _INQ_RR, _INQ_RR2],
                           ents=_ents, rules=_rules))
    _inq_at[_nm] = _i
    # Isannan komentajapakko tayttyy myos Inquisitor Lordilla.
    _md = [r for x in _L["secs"] for r in (x.get("rules") or [])
           if r.get("kind") == "mandatory_at"]
    for _r in _md:
        _pick = _r.get("pick") or [dict(sec=j) for j in (_r.get("sec") or [])]
        _r["pick"] = list(_pick) + [dict(sec=_i, re="^inquisitor lord")]
    _inq_n += 1
assert _inq_n == 8, _inq_n
print("Inquisition liitetty %d isantalistalle (s.138)" % _inq_n)


# --- 1.1 vaihe 4: Bastion Fleetsin Chaos-reservit (Fleets s.39) -------------
# "However, since a reserve fleet also draws on very old or scarce vessels,
# you may also use your reserve choices to select any of the following Chaos
# vessels if you so wish." Viisi runkoa nimeltä, ja suhde on kirjan yleinen:
# "These 'reserve' vessels are picked in the normal manner, so for every three
# vessels of a given type which you choose from the main fleet list, you may
# pick one vessel of that type from another Imperial list, or from the above
# selection of Chaos vessels (but not both)."
#
# Hinnat eivat ole s.39:lla lainkaan; ne luetaan Chaos-listoilta, joilla ne
# ovat samat joka listalla (Repulsive 230, Executor 210, Hades 200, Carnage
# 180, Murder 170). Varianttikielto s.39: "you cannot pick any of the ship
# class variants described since these are described for vessels who have
# already turned traitor" -> noopt.
_BAST_SRC = ("However, since a reserve fleet also draws on very old or scarce "
             "vessels, you may also use your reserve choices to select any of "
             "the following Chaos vessels if you so wish.")
_BAST_RATIO = ("These 'reserve' vessels are picked in the normal manner, so for "
               "every three vessels of a given type which you choose from the "
               "main fleet list, you may pick one vessel of that type from "
               "another Imperial list, or from the above selection of Chaos "
               "vessels (but not both).")
_BAST_NOVAR = ("Reserve vessels use all their normal rules and keep their "
               "particular ordnance types (i.e. Chaos ordnance is used on Chaos "
               "ships picked in a reserve fleet) but you cannot pick any of the "
               "ship class variants described since these are described for "
               "vessels who have already turned traitor and hence obviously no "
               "longer in Imperial service!")
_BAST = _p18_list("Imperial Navy \u2014 Bastion Fleets")
_bsec = _p18_sec(_BAST, "THE RESERVE FLEETS OF SEGMENTUM OBSCURUS")
assert not _BAST["secs"][_bsec]["ents"], "Bastionin reserviosiossa on jo rivaja"
_BAST["secs"][_bsec].setdefault("notes", []).append(
    "Page 39 names these five Chaos hulls but prints no prices; the builder "
    "uses each hull's price from the Chaos fleet lists.")
_BAST["secs"][_bsec]["ents"] = [
    # `nt` tulostuu kortin perusriville englanninkielisen tekstin keskelle,
    # joten rakentajan oma huomautus kuuluu osion Builder's notes -kanavaan.
    # Taalla oli suomenkielinen lause, joka nakyi pelaajan kortilla.
    _p18_unit("Repulsive class grand cruiser", 269, 230, 39),
    _p18_unit("Executor class grand cruiser", 271, 210, 39),
    _p18_unit("Hades class heavy cruiser", 274, 200, 39),
    _p18_unit("Carnage class cruiser", 277, 180, 39),
    _p18_unit("Murder class cruiser", 279, 170, 39),
]
# Kielto koskee vain luokkavariantteja, ei kaikkia optioita (katselmointi
# 16.9.): s.12 maarittelee variantin aluksiksi, jotka "mount different
# weaponry to its counterparts". Repulsiven ancient targeting systems on
# Bringer of Despairin aseistus ja Murderin FP4 + lanssit Plagueclaw'n;
# Repulsiven kolmas kilpi ei muuta aseistusta, joten se jaa valittavaksi.
_BAST_VARIANT = {269: r"ancient targeting systems", 279: r"replace its Firepower 10 weapons batteries"}
for _e in _BAST["secs"][_bsec]["ents"]:
    if _e["r"] in _BAST_VARIANT:
        _hit = [o for o in (ships[str(_e["r"])].get("ol") or []) if re.search(_BAST_VARIANT[_e["r"]], o.get("t") or "", re.I)]
        assert len(_hit) == 1, "%s: variantti-optioita %d" % (_e["l"], len(_hit))
        _e["optno"] = _BAST_VARIANT[_e["r"]]
assert sum(1 for _e in _BAST["secs"][_bsec]["ents"] if _e.get("optno")) == 2
# Osiossa on jo kirjan oma poiminta samoista lauseista, joten kuratoidut
# lisataan vain jos ne puuttuvat (tarkastuksen loydos 14.9.2026).
add_text(_BAST["secs"][_bsec], [_BAST_SRC, _BAST_RATIO, _BAST_NOVAR])
print("Bastionin Chaos-reservit lisatty: %d runkoa (s.39)"
      % len(_BAST["secs"][_bsec]["ents"]))


# --- J144: Ordo Malleus -inkvisiittori ja Bastionin Chaos-rungot (Fleets s.142)
# Kayttajan paatos 16.9.: tehdaan samalla kuin Strange happenings (J143).
#
# s.140: "The listed cost is added to that of the Inquisitor Lord, and its
# benefits apply to the ship they are embarked upon." Isantalistoilla oli vain
# Inquisitor Lord (J104), joten "fleet led by an Ordo Malleus Inquisitor" ei
# ollut mahdollinen. Ordo Malleus -rivi lisataan viidelle Imperial Navy- ja
# Adeptus Mechanicus -isannalle - s.142:n reitti koskee vain niita. Space
# Marine -isannille sita ei lisata: siella Ordo Malleus avaisi Grey Knights
# Battle bargen (s.138), joka on J83:n mukaan Grey Knights -listan asia.
#
# s.142 Reserve/allies: "For no change in their cost, a fleet led by an Ordo
# Malleus Inquisitor may take as reserves any Chaos ship listed in the Bastion
# Fleet List" - viisi runkoa s.39:lta samoin hinnoin. Ne tulevat isannan omaan
# reserviosioon (ct "reserve"), joten ne kuluttavat saman 1:3-budjetin kuin
# muut reservit eivatka ole lainattavissa eteenpain (s.15). Bastionille osiota
# ei lisata: sen oma s.39-osio tarjoaa samat rungot jo ilman inkvisiittoria.
_OM_T = "ORDO MALLEUS INQUISITORS"
_OM_RES_T = "ORDO MALLEUS RESERVES"
_OM_ROUTE = ("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor "
             "that does not include Space Marine vessels may has the following "
             "addition to its reserves and/or allies rules: For no change in their "
             "cost, a fleet led by an Ordo Malleus Inquisitor may take as reserves "
             "any Chaos ship listed in the Bastion Fleet List on p.37 of the "
             "Remastered Fleetbook.")
_OM_FREE = ("These vessels are free of the “Strange Happenings” special rule "
            "as long as the Inquisitor’s ship remains in play, but the fleet may "
            "not take any Grey Knights vessels!")
_OM_HNR = ("Hit and Run attacks from this ship add +1 to their roll, and such "
           "attacks against this ship subtract -1 from their roll.")
# Wardsin raja (s.142). Poiminnan lausesuodatin pudotti taman, jolloin kortti
# paattyi "etc." ilman rajaa ja CSM-miehistoisen aluksen +boarding olisi voinut
# lukea kumotuksi (katselmointi 16.9.).
_OM_CSM = ("Rules for Chaos Space Marines still apply normally, and any other special "
           "rules and effects such as the Forces of Chaos listed on pg.158 of the "
           "Rulebook remain unaffected.")
# s.140: Ordon hinta ja hyodyt kuuluvat Inquisitor Lordin omalle alukselle.
# Isantalistan kortilla Ordo-rivi on oma komentajakorttinsa, joten lause
# tulostetaan sille; Inquisition-listalla se on jo osiossa 13.
_OM_EMBARK = ("The listed cost is added to that of the Inquisitor Lord, and its "
              "benefits apply to the ship they are embarked upon.")
_IQL = _p18_list("The Emperor's Inquisition")
_iq_om = _IQL["secs"][_p18_sec(_IQL, _OM_T)]
assert [e["l"] for e in _iq_om["ents"]] == ["Ordo Malleus Inquisitor Lord"], _iq_om["ents"]
assert len(_iq_om.get("own") or []) == len(_iq_om["text"]), "Ordo Malleus: own ja text eri pituisia"
# Poiminnasta puuttui s.142:n Hit and Run -lause, joka Ordo Hereticuksella on
# (s.140). Kirjan lause, lisataan omistajineen molempiin kopioihin.
if not any(_text_key(_OM_HNR) in _text_key(t) for t in _iq_om["text"]):
    _iq_om["text"].insert(1, _OM_HNR)
    _iq_om["own"].insert(1, "Ordo Malleus Inquisitor Lord")
if not any(_text_key(_OM_CSM) in _text_key(t) for t in _iq_om["text"]):
    _slaa = [i for i, t in enumerate(_iq_om["text"]) if t.startswith("Marks of Slaanesh")]
    assert len(_slaa) == 1, _slaa
    _iq_om["text"].insert(_slaa[0] + 1, _OM_CSM)
    _iq_om["own"].insert(_slaa[0] + 1, "Ordo Malleus Inquisitor Lord")
_OM_HOSTS = ("Imperial Navy — Gothic Sector", "Imperial Navy — Bastion Fleets",
             "Imperial Navy — Armageddon Sector", "Imperial Navy — Bakka Sector",
             "Adeptus Mechanicus — Explorator")
_bast_rows = _BAST["secs"][_bsec]["ents"]
assert len(_bast_rows) == 5 and sum(1 for e in _bast_rows if e.get("optno")) == 2, "Bastionin s.39-rivit muuttuivat"
_om_n = 0
_om_res_n = 0
_om_res_at = {}
for _nm in _OM_HOSTS:
    _L = _p18_list(_nm)
    _inq = _p18_sec(_L, "THE INQUISITION")
    _om = len(_L["secs"])
    _row = dict(_iq_om["ents"][0])
    _row["ld"] = dict(_row["ld"])
    _row["mx"] = 1
    _L["secs"].append(dict(
        t=_OM_T, text=[_OM_EMBARK] + list(_iq_om["text"]),
        own=["Ordo Malleus Inquisitor Lord"] + list(_iq_om["own"]), notes=[],
        ents=[_row],
        rules=[dict(kind="requires", ok=True,
                    label="Ordo Malleus Inquisitor needs an Inquisitor Lord",
                    if_pick=[dict(sec=_om, re="^ordo malleus")],
                    then_pick=[dict(sec=_inq, re="^inquisitor lord")], min=1,
                    src=_OM_EMBARK)]))
    _om_n += 1
    if _nm == "Imperial Navy \u2014 Bastion Fleets":
        continue
    _res = len(_L["secs"])
    _om_res_at[_nm] = _res
    # Space Marine -alukset: toisen rodun listalta lainatut (race-poiminta) ja
    # listan omat Space Marine -rivit (Armageddonin tahdella merkityt, s.41).
    _sm = [dict(race="space marines")]
    for _j, _x in enumerate(_L["secs"]):
        if any(e.get("k") == "unit" and re.search(r"[^*]\*$", e["l"]) for e in _x["ents"]):
            _sm.append(dict(sec=_j, re=r"[^*]\*$"))
    assert (len(_sm) > 1) == (_nm == "Imperial Navy \u2014 Armageddon Sector"), \
        "%s: tahdella merkittyja Space Marine -riveja %d osiossa" % (_nm, len(_sm) - 1)
    _L["secs"].append(dict(
        # Molemmat lauseet ovat saantojen src:ina "Checked by the builder"
        # -ryhmassa; osion tekstina ne toistuisivat "Check yourself" -ryhmassa.
        t=_OM_RES_T, text=[],
        notes=["Page 142 names no hulls: it points to the Chaos ships of the Bastion "
               "Fleet List, which are the five of page 39, at the same prices."],
        ents=[dict(_p18_unit(e["l"], e["r"], e["p"], 142), **({"optno": e["optno"]} if e.get("optno") else {}))
              for e in _bast_rows],
        rules=[
            dict(kind="requires", ok=True, what="an Ordo Malleus Inquisitor",
                 label="Chaos reserves need an Ordo Malleus Inquisitor",
                 if_pick=[dict(sec=_res)],
                 then_pick=[dict(sec=_om, re="^ordo malleus")], min=1, src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Space Marine vessels with Ordo Malleus Chaos reserves",
                 pick=_sm, cond_pick=[dict(sec=_res)], max_met=0, max_unmet=None,
                 src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Grey Knights vessels with Ordo Malleus Chaos reserves",
                 pick=[dict(hull="^GREY KNIGHTS")], cond_pick=[dict(sec=_res)],
                 max_met=0, max_unmet=None, src=_OM_FREE),
        ]))
    _om_res_n += 1
assert _om_n == 5 and _om_res_n == 4, (_om_n, _om_res_n)
print("Ordo Malleus: %d isantaa, Chaos-reservit %d isannalle (s.142)" % (_om_n, _om_res_n))


# Bakan oma reservisaanto (s.50) on nyt yleissaannon kanssa paallekkainen:
# moottori valvoo saman 1:3-suhteen koko laivastosta, ja listakohtainen
# saanto laski vain RESERVES-osion rivit. Kaksi punaista rivia samasta
# virheesta on huonompi kuin yksi, joten listakohtainen poistetaan ja sen
# lause jaa nakyviin tekstina.
_BAKKA = _p18_list("Imperial Navy — Bakka Sector")
_bkr = _p18_sec(_BAKKA, "RESERVES")
_dup = [r for r in _BAKKA["secs"][_bkr]["rules"]
        if r.get("label") == "Reserve cruisers, battlecruisers and grand cruisers"]
assert len(_dup) == 1, "Bakan reservisaantoja %d" % len(_dup)
_BAKKA["secs"][_bkr]["rules"] = [r for r in _BAKKA["secs"][_bkr]["rules"]
                                 if r is not _dup[0]]
add_text(_BAKKA["secs"][_bkr], [_dup[0]["src"]])
print("Bakan paallekkainen reservisaanto poistettu (yleissaanto s.14 valvoo sen)")

# Reserviosion rungot laivaston rajoihin (J144, katselmointi 16.9.). Taman
# jalkeen, koska Bakan poistettu reservisaanto oli myos cruisers-pohjainen. s.14: "the
# restrictions on maximum and minimum numbers of ships are determined for the
# fleet as a whole, regardless of whether they were purchased from the list or
# as reserves." Moottori laskee listan oman rivin vain sen omassa osiossa,
# joten 12 Lunaria ja Carnage nayttivat "Cruisers 12 / 12" - sama vika oli jo
# Bastionin s.39-osiossa. Kuten renegaateilla (J141): poiminta lisataan
# saantoihin. Jako tulee Bastionin omalta sivulta, jonka rungot nama ovat
# (s.37): risteilijat (Hades, Carnage, Murder) 0-12-rajaan ja taistelulaiva-
# ja taisteluristeilijasuhteen pohjaan; "Grand Cruisers do not count as
# cruisers for purposes of fielding battleships", ja ne jakavat "one
# battlecruiser or grand cruiser ... for every two cruisers" -paikan.
_RES_CRU = "^(hades|carnage|murder) class"
_RES_GC = "grand cruiser"
def _reserve_limits(L, rsec):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers")
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            if _r["kind"] == "section_count" and _r.get("max") == 12 and _r.get("sec") == [cru]:
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + [dict(sec=rsec, re=_RES_CRU)]
                hits.append("0-12")
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            _r["per_pick"] = per + [dict(sec=rsec, re=_RES_CRU)]
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                _r["allow_pick"] = allow + [dict(sec=rsec, re=_RES_GC)]
                hits.append("bc")
            else:
                hits.append("bs")
    return sorted(hits)
_lim = {}
for _nm, _rs in _om_res_at.items():
    _lim[_nm] = _reserve_limits(_p18_list(_nm), _rs)
_lim["Imperial Navy — Bastion Fleets"] = _reserve_limits(_BAST, _bsec)
assert _lim == {
    "Imperial Navy — Gothic Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Armageddon Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Bakka Sector": ["0-12", "bc", "bs"],
    "Adeptus Mechanicus — Explorator": ["bs"],
    "Imperial Navy — Bastion Fleets": ["0-12", "bc", "bs"],
}, _lim
print("reserviosioiden rungot rajoihin: %d saantoa" % sum(len(v) for v in _lim.values()))



# --- 1.1 vaihe 4: Rogue Tradersin xenos-liittolaiset (Fleets s.175) --------
# "For every 750 points in the fleet, Rogue Traders may be accompanied by a
# single Demiurg or Kroot vessel unless the fleet is using auxiliary ships
# that cannot be allies with the Demiurg or Kroot (such as Space Marines)."
#
# Osio XENOS ALLIES on listalla olemassa ja lause sen tekstina, mutta rivit
# puuttuivat. Hinnat luetaan Demiurgin ja Tau:n listoilta (s.487, s.494).
# Lause ei sano "or part thereof", joten 750 luetaan TAYTENA - toisin kuin
# esim. s.174:n "for every 750 points or part thereof".
#
# Poikkeuslauseen ("such as Space Marines") ehtoa ei tarvita talla listalla:
# Space Marine -rivi on vain Pirates and Wolf Packs -listalla (s.179), jolla
# on omat xenos-saantonsa. Exploration-lista sanoo s.176 nimenomaan, etta sen
# omat saannot korvaavat taman, ja ne ovat jo datassa (s.177).
_RTX_SRC = ("For every 750 points in the fleet, Rogue Traders may be "
            "accompanied by a single Demiurg or Kroot vessel unless the fleet "
            "is using auxiliary ships that cannot be allies with the Demiurg "
            "or Kroot (such as Space Marines).")
_RTX = _p18_list("Rogue Traders")
_rtx = _p18_sec(_RTX, "XENOS ALLIES")
assert not _RTX["secs"][_rtx]["ents"], "RT: XENOS ALLIES -osiossa on jo rivaja"
_RTX["secs"][_rtx].setdefault("notes", []).append(
    "Page 175 allows a Demiurg or Kroot vessel but names no classes and prints "
    "no prices; the builder offers the Demiurg fleet list's vessels at their "
    "prices there (page 487).")
_RTX["secs"][_rtx]["ents"] = [
    _p18_unit("Stronghold Commerce Vessel", 488, 350, 175),
    _p18_unit("Bastion Commerce Vessel", 489, 255, 175),
    _p18_unit("Citadel Commerce Vessel", 490, 185, 175),
    _p18_unit("Kroot Warsphere", 494, 145, 175),
]
_RTX["secs"][_rtx]["rules"] = list(_RTX["secs"][_rtx].get("rules") or []) + [dict(
    kind="per_points", each=1, per=750, full=True, ok=True, sec=[_rtx],
    label="Demiurg and Kroot vessels (one per full 750 pts)",
    pick=[dict(sec=_rtx)], src=_RTX_SRC)]
print("Rogue Tradersin xenos-liittolaiset lisatty: %d runkoa (s.175)"
      % len(_RTX["secs"][_rtx]["ents"]))

# --- 1.1 vaihe 4: Bakan Rogue Trader -risteilija (Fleets s.50) -------------
# "One Rogue Trader cruiser and its attendant escorts may be taken for every
# 750 points in the fleet." Sama lukutapa kuin s.175:lla: ei "or part
# thereof", joten taydet 750. Saattajat ("attendant escorts") jaavat
# tekstiksi: ne ovat Rogue Trader -listan oma laivuesaanto (s.174).
_BKRT_SRC = ("One Rogue Trader cruiser and its attendant escorts may be taken "
             "for every 750 points in the fleet.")
_BK = _p18_list("Imperial Navy \u2014 Bakka Sector")
assert not any(e.get("r") == 180 for x in _BK["secs"] for e in x["ents"]), \
    "Bakka: Rogue Trader Cruiser on jo"
_bkrt = len(_BK["secs"])
_BK["secs"].append(dict(t="ROGUE TRADERS", text=[_BKRT_SRC],
                        ents=[_p18_unit("Rogue Trader Cruiser", 180, 185, 50)],
                        rules=[dict(kind="per_points", each=1, per=750, full=True,
                                    ok=True, sec=[_bkrt],
                                    label="Rogue Trader cruisers (one per full 750 pts)",
                                    pick=[dict(sec=_bkrt)], src=_BKRT_SRC)]))
print("Bakan Rogue Trader -risteilija lisatty (s.50)")


# --- 1.1 vaihe 4: Chaosin renegaatit (Fleets s.222) ------------------------
# "RENEGADE IMPERIAL VESSELS ... For every 1,500 points in a Chaos fleet, one
# cruiser from any Imperial Navy fleet list up to 185 points and/or up to six
# Imperial Navy escorts may be taken. Special weapon rules, Nova Cannon,
# Chaos Lords, Chaos Space Marines, Chaos ordnance or Daemonship upgrades may
# not be taken for Imperial Navy vessels used in this manner, and cruisers
# suffer -1Ld for going renegade. Imperial Navy escorts need not be in a
# single squadron and may be interspersed within other Chaos escort squadrons
# if desired. These vessels may not take any upgrade listed in their profile
# and do not count as reserves; they count as Chaos vessels in all respects."
#
# Sivu 222 on Chaosin SPECIAL RULES -sivu, joka jai listojen saantoikkunan
# (lists.py rules_pages, kuusi sivua) ulkopuolelle. Sita ei laajenneta:
# ikkunan kasvattaminen toisi kymmenia sivuja kertomusta kahdelletoista
# listalle. Osio ja sen lause kirjataan tassa suoraan, jolloin pelaaja nakee
# tasan saman tekstin.
#
# "they count as Chaos vessels in all respects" -> rivit ovat Chaos-listan
# omia, joten ne eivat ole reserveja eika rotuportti koske niita, ja ne
# lasketaan listan omiin risteilija- ja saattajarajoihin (section_count.pick).
# "may not take any upgrade listed in their profile" -> noopt.
_REN_SRC = ("For every 1,500 points in a Chaos fleet, one cruiser from any "
            "Imperial Navy fleet list up to 185 points and/or up to six "
            "Imperial Navy escorts may be taken.")
_REN_SRC2 = ("Special weapon rules, Nova Cannon, Chaos Lords, Chaos Space "
             "Marines, Chaos ordnance or Daemonship upgrades may not be taken "
             "for Imperial Navy vessels used in this manner, and cruisers "
             "suffer -1Ld for going renegade. Imperial Navy escorts need not "
             "be in a single squadron and may be interspersed within other "
             "Chaos escort squadrons if desired. These vessels may not take "
             "any upgrade listed in their profile and do not count as "
             "reserves; they count as Chaos vessels in all respects.")
# Imperiumin rungot: risteilijat enintaan 185 pistetta ja saattajat. Hinnat
# ovat Imperial Navy -listojen omat; Space Marine -rungot eivat ole mukana,
# koska kirja sanoo "Imperial Navy fleet list" ja "Imperial Navy escorts".
_REN_CRUISERS = [("Tyrant class cruiser", 69, 185), ("Gothic class cruiser", 70, 180),
                 ("Lunar class cruiser", 71, 180), ("Defiant class light cruiser", 76, 120),
                 ("Endeavour class light cruiser (Bakka)", 73, 115),
                 ("Endurance class light cruiser (Bakka)", 75, 115),
                 ("Dauntless class light cruiser", 77, 110),
                 ("Endeavour class light cruiser", 72, 110),
                 ("Endurance class light cruiser", 74, 110),
                 ("Siluria class light cruiser", 78, 100)]
_REN_ESCORTS = [("Firestorm class frigate", 79, 40), ("Sword class frigate", 82, 35),
                ("Falchion class frigate", 80, 35), ("Havoc class frigate", 81, 35),
                ("Viper class destroyer", 83, 35), ("Cobra class destroyer", 84, 30)]
_REN_CRU_RE = "^(tyrant|gothic|lunar|defiant|endeavour|endurance|dauntless|siluria)"
_REN_ESC_RE = "^(firestorm|sword|falchion|havoc|viper|cobra)"
_ren_n = 0
for _nm in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
            "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 69 for x in _L["secs"] for e in x["ents"]), \
        "%s: renegaatit on jo" % _nm
    _i = len(_L["secs"])
    _ents = ([_p18_unit(_l, _r, _p, 222, noopt=True) for _l, _r, _p in _REN_CRUISERS]
             + [_p18_unit(_l, _r, _p, 222, noopt=True) for _l, _r, _p in _REN_ESCORTS])
    _L["secs"].append(dict(t="RENEGADE IMPERIAL VESSELS", text=[_REN_SRC, _REN_SRC2],
        ents=_ents, rules=[
            dict(kind="per_points", each=1, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial cruisers (one per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_CRU_RE)], src=_REN_SRC),
            dict(kind="per_points", each=6, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial escorts (up to six per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_ESC_RE)], src=_REN_SRC)]))
    # "they count as Chaos vessels in all respects": listan omat risteilija- ja
    # saattajarajat laskevat nama mukaan.
    _cru = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "cruisers"]
    assert len(_cru) == 1, "%s: Cruisers-osioita %d" % (_nm, len(_cru))
    _esc = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "escorts"]
    assert len(_esc) == 1, "%s: ESCORTS-osioita %d" % (_nm, len(_esc))
    _hit = 0
    for _r in _L["secs"][_cru[0]].get("rules") or []:
        if _r.get("kind") == "section_count":
            _r["pick"] = [dict(sec=_cru[0]), dict(sec=_i, re=_REN_CRU_RE)]
            # Koko s.222:n kappale liimautui ennen "0-12 Cruisers" -rivin
            # peraan ilman erotinta, ja laillisuuspaneeli naytti sen rajan
            # omana lauseena ("0-12 Cruisers Special weapon rules, Nova
            # Cannon, ..."). Saannon src on kirjan lauseen kanava, joten se
            # pysyy kirjan rivina, ja rakentajan selitys siita miksi
            # renegaatit laskevat mukaan kuuluu Builder's notes -kanavaan
            # (J121) - check_pages.py hylkasi ensimmaisen yrityksen, joka
            # kirjoitti selityksen src:hen.
            _L["secs"][_cru[0]].setdefault("notes", []).append(
                "Renegade Imperial cruisers taken under Renegade Imperial "
                "Vessels count toward this limit too: the book says they count "
                "as Chaos vessels in all respects (Fleets p. 222).")
            _hit += 1
    assert _hit == 1, "%s: risteilijarajoja %d" % (_nm, _hit)
    # Sama perustelu kuin risteilijarajalle: "they count as Chaos vessels in
    # all respects" (s.222). Katselmointi 16.9. loysi, etta renegaatti laski
    # 0-12-rajaan mutta ei suhteisiin "one battleship for every three
    # cruisers or heavy cruisers" - kolme Murderia ja renegade-Lunar antoivat
    # yhden taistelulaivan sijaan nolla.
    _ratio = 0
    for _sx in _L["secs"]:
        for _r in _sx.get("rules") or []:
            if _r.get("kind") != "ratio" or _r.get("per_pick"):
                continue
            if _cru[0] not in (_r.get("per_sec") or []):
                continue
            _r["per_pick"] = ([dict(sec=_x) for _x in _r["per_sec"]]
                              + [dict(sec=_i, re=_REN_CRU_RE)])
            _ratio += 1
    assert _ratio == 3, "%s: risteilijaa laskevia suhteita %d" % (_nm, _ratio)
    for _r in _L["secs"][_esc[0]].get("rules") or []:
        if _r.get("kind") == "squadron" and not _r.get("pick"):
            _r["pick"] = [dict(sec=_esc[0]), dict(sec=_i, re=_REN_ESC_RE)]
    _ren_n += 1
assert _ren_n == 6, _ren_n
print("Chaosin renegaatit lisatty %d listalle (s.222)" % _ren_n)

# ---------------------------------------------- rotu ja alustyyppi (s.14-15)
# Fleets s.14: "Reserve vessels ... must come from the same 'race'. For the
# purpose of the game, the races are: Imperial Navy (including Adeptus
# Mechanicus), Space Marines, Chaos (including Chaos Space Marines), Eldar,
# Craftworld Eldar, Dark Eldar, Orks, Necrons, Tyranids and Tau (including
# Tau allies)."
#
# Luettelo on SULJETTU ("the races are"). Lista, jota siina ei ole, ei saa
# rotua lainkaan: se paasee toiseen laivastoon vain oman listasaantonsa
# kautta, ja s.15 sanoo ettei sita saa silloin ottaa myos reservina
# ("These may only be taken exactly as described on their fleet list rules
# and may not also be taken as reserves"). Rogue Traders (s.174), Demiurg
# ja Kroot (s.15), Inquisition (s.138) ja Grey Knights (s.138, s.145)
# kuuluvat kaikki tahan joukkoon.
#
# Eldar ja Craftworld Eldar ovat kirjan luettelossa ERI rotuja, joten
# Corsairs ja Iyanden eivat ole toistensa reserveja - niiden suhde on s.16:n
# nimetty poikkeus (Eldar Hero Flame of Asuryanin kyydissa).
_LDASH = "—"          # listojen nimissa oleva em-viiva
RACE_NAMES = ["imperial navy", "space marines", "chaos", "eldar",
              "craftworld eldar", "dark eldar", "orks", "necrons",
              "tyranids", "tau"]
LIST_RACE = [
    ("Imperial Navy %s Gothic Sector", "imperial navy", "s.14 rotuluettelo"),
    ("Imperial Navy %s Bastion Fleets", "imperial navy", "s.14 rotuluettelo"),
    ("Imperial Navy %s Armageddon Sector", "imperial navy", "s.14 rotuluettelo"),
    ("Imperial Navy %s Bakka Sector", "imperial navy", "s.14 rotuluettelo"),
    ("Adeptus Mechanicus %s Explorator", "imperial navy",
     "s.14 nimeaa nimenomaan: 'Imperial Navy (including Adeptus Mechanicus)'"),
    ("Space Marines %s Codex Astartes", "space marines", "s.14 rotuluettelo"),
    ("Space Marines %s Crusade", "space marines", "s.14 rotuluettelo"),
    ("Space Marines %s Dominion", "space marines", "s.14 rotuluettelo"),
    ("The Emperor's Inquisition", None,
     "ei rotuluettelossa. s.138: 'The Inquisition has no fleet list on its "
     "own. Instead, there are various ways to add an Inquisitor or "
     "Inquisitorial ships to the Imperial factions.' Nimetty paasy, ei "
     "reservi (s.15)"),
    ("Grey Knights", "space marines",
     "s.144 sanoo sanatarkasti: 'Grey Knights count as Space Marines in all "
     "respects and as such follow all rules for Space Marines as written on "
     "pages 92-94.' Rotu on pelitekninen ryhma, ja kirja nimeaa sen itse. "
     "Ehdollinen paasy Imperiumin laivastoihin ei kierry tasta ohi, koska "
     "s.146 kieltaa molemmat suunnat erikseen: 'A Grey Knights fleet will "
     "not take ships from or provide ships to any other fleet list as "
     "reserves or allies' - kielto (res_ban) ratkaistaan ennen rotua. "
     "Kayttajan paatos T37, 14.9.2026"),
    ("Rogue Traders", None,
     "ei rotuluettelossa. s.174: 'Any fleet except Necrons or Tyranids may "
     "include a single Rogue Trader capital ship' - oma nimetty saanto"),
    ("Rogue Traders %s Exploration", None, "kuten Rogue Traders (s.174)"),
    ("Rogue Traders %s Pirates and Wolf Packs", None, "kuten Rogue Traders (s.174)"),
    ("Chaos %s Incursion", "chaos", "s.14 'Chaos (including Chaos Space Marines)'"),
    ("Chaos %s Black Crusade", "chaos", "s.14 rotuluettelo"),
    ("Chaos %s Tzeentch", "chaos", "s.14 rotuluettelo"),
    ("Chaos %s Nurgle", "chaos", "s.14 rotuluettelo"),
    ("Chaos %s Khorne", "chaos", "s.14 rotuluettelo"),
    ("Chaos %s Slaanesh", "chaos", "s.14 rotuluettelo"),
    ("Eldar Corsairs %s Gothic Sector", "eldar", "s.14 rotuluettelo: Eldar"),
    ("Eldar Corsairs %s Later Gothic War", "eldar", "s.14 rotuluettelo: Eldar"),
    ("Eldar %s Iyanden Craftworld", "craftworld eldar",
     "s.14 luettelee Craftworld Eldarin omana rotunaan"),
    ("Dark Eldar %s Pirates", "dark eldar", "s.14 rotuluettelo"),
    ("Orks %s Cyclops Cluster", "orks", "s.14 rotuluettelo"),
    ("Orks %s Waaagh!", "orks", "s.14 rotuluettelo"),
    ("Orks %s Da Ork Clanz", "orks", "s.14 rotuluettelo"),
    ("Necrons %s Harvest Fleet", "necrons", "s.14 rotuluettelo"),
    ("Tyranids %s Vanguard Fleet", "tyranids", "s.14 rotuluettelo"),
    ("Tyranids %s Hive Fleet", "tyranids", "s.14 rotuluettelo"),
    ("Tau %s Merchant Fleet", "tau", "s.14 'Tau (including Tau allies)'"),
    ("Tau %s Commerce Protection", "tau", "s.14 'Tau (including Tau allies)'"),
    ("Demiurg %s War Host", "tau",
     "s.15:n rotuluettelo sanoo 'Tau (including Tau allies)', ja s.482 "
     "nimeaa Demiurgin yhdeksi niista: 'there are three races commonly "
     "observed as part of Tau fleets - the Kroot, the Nicassar and the "
     "Demiurg'. Rotu on pelitekninen ryhma eika biologinen laji, joten "
     "Demiurg kuuluu Tau-ryhmaan vaikka se on omaa kansaansa. Tau-listojen "
     "oma Demiurg-osio on yha nimetty paasy (ct access), jota s.15 kieltaa "
     "ottamasta myos reservina - se saanto ei muutu tasta. "
     "Kayttajan paatos T37, 14.9.2026"),
]

# Fleets s.14: "Only ships of the same 'type' (battleship, cruiser or escort)
# count for reserves purposes" ja "battlecruisers, grand cruisers, heavy
# cruisers, cruisers, and light cruisers all count as 'cruisers'".
#
# Profiilin ty-kentta riittaa naille neljalle; kaikki muut (Defence, Ground)
# on luettava kasin, koska kirja ei anna niille tyyppia automaattisesti.
SHIP_RT_BY_TY = {"Battleship": "battleship", "Cruiser": "cruiser",
                 "Grand Cruiser": "cruiser", "Escort": "escort"}
SHIP_RT_EXCEPTIONS = [
    ("286", "battleship",
     "s.288: 'It counts as a battleship for purposes of taking another so in "
     "order to take a second battleship, the fleet must already have six "
     "cruisers and/or heavy cruisers.' Kirja antaa hulkille taistelulaivan "
     "aseman nimenomaisesti; lause rajaa sen taistelulaivojen laskentaan, "
     "mika on juuri reservisaannon laskenta"),
    ("389", "none",
     "Ork hulk: kirja ei anna sille kolmesta tyypista mitaan. Maaraa oma "
     "saanto (s.367 'maximum of one space hulk per 1,500 points', s.372 "
     "'An Ork fleet with at least three Warlords may include one Space Hulk')"),
    ("392", "none", "Rok on puolustusrakennelma, ei battleship/cruiser/escort"),
    ("494", "none",
     "Kroot Warsphere tulee laivastoon vain nimetyn paasyn kautta (s.456-457, "
     "s.487), ja s.15 kieltaa ottamasta samaa alusta myos reservina"),
    ("492", "none", "Nicassar Caravan: nimetty paasy Tau-listoilla (s.457)"),
    ("493", "none", "Nicassar Rig: nimetty paasy Tau-listoilla (s.457)"),
    ("196", "none", "Stryxis Caravan Vessel: Rogue Trader -listojen nimetty rivi"),
    ("110", "none", "Fortress-Monastery on asema (s.98), ei alustyyppi"),
    ("284", "none", "Activated Blackstone Fortress on asema"),
    ("506", "none", "Blackstone Fortress on asema"),
    ("500", "none", "Ramilies class star fort on asema"),
    ("334", "none", "Haven space station on asema"),
    ("334b", "none", "Haven Dark Eldar -tukikohtana (s.347) on sama asema"),
    ("507", "none", "Space station on asema"),
    ("508", "none", "Orbital dock on asema"),
    ("509", "none", "Orbital defence laser platform on asema"),
    ("510", "none", "Orbital torpedo launcher on asema"),
    ("511", "none", "Orbital weapons platform on asema"),
    ("478", "none", "Kor caste orbital city on asema"),
    ("479", "none", "Security orbital on asema"),
    ("480", "none", "Orbitals on asema"),
    ("481", "none", "Waystation on asema"),
    ("517", "none", "Air base low orbit defences on maakohde"),
    ("517b", "none", "Defence laser silo on maakohde (s.517)"),
    ("517c", "none", "Missile silo on maakohde (s.517)"),
    # Kirja painaa naille tyypin Escort/1, mutta ne ostetaan planetary
    # defences -listalta (s.499), ei laivastolistalta: s.498 "these ships
    # have no warp engines and are therefore confined to the system", ja
    # reservisaanto laskee vain "battleships, cruisers or escorts chosen from
    # the fleet list" (s.14). Ilman naita riveja kolme system shipia (60 pts)
    # avasi reserviescortin paikan.
    ("514", "none", "Defence monitor on planetary defence (s.498-499), ei laivastolistan escort"),
    ("515", "none", "System ship on planetary defence (s.498-499), ei laivastolistan escort"),
    ("516", "none", "Fire ship on planetary defence (s.499), ei laivastolistan escort"),
]

_race_hits = {}
for _nm, _race, _why in LIST_RACE:
    _nm = _nm % ((_LDASH,) * _nm.count("%s")) if "%s" in _nm else _nm
    assert _race is None or _race in RACE_NAMES, "tuntematon rotu: %r" % _race
    _hit = [Lz for Lz in lists_out if Lz["nm"] == _nm]
    assert len(_hit) == 1, ("LIST_RACE: lista %r ei loydy tasan kerran (%d)"
                            % (_nm, len(_hit)))
    assert _nm not in _race_hits, "LIST_RACE: %r kahdesti" % _nm
    _race_hits[_nm] = True
    _hit[0]["race"] = _race
def check_races(lists):
    """Jokaisella listalla on oltava rotu tai nimenomainen None. Uusi lista
    ei saa jaada hiljaa rodutta: silloin se putoaisi reservisaannosta
    huomaamatta."""
    no = [Lz["nm"] for Lz in lists if "race" not in Lz]
    assert not no, "LIST_RACE: rodutta jai %s" % no


def check_ship_types(ships_):
    """Jokaisella profiililla on oltava kirjan tyyppi. Luokittelematon alus
    ei saa jaada oletukselle: kirja ei anna Defence-rungoille tyyppia."""
    bad = [k for k, v in ships_.items()
           if v.get("rt") not in ("battleship", "cruiser", "escort", "none")]
    assert not bad, "alustyyppi (rt) puuttuu: %s" % bad[:5]


check_races(lists_out)
print("rotuja kirjattu: %d listaa, joista rotuluettelossa %d"
      % (len(lists_out), sum(1 for Lz in lists_out if Lz["race"])))

_rt_used = {}
for _pg, _rt, _why in SHIP_RT_EXCEPTIONS:
    assert _pg in ships, "SHIP_RT_EXCEPTIONS: profiilia %s ei ole" % _pg
    assert _pg not in _rt_used, "SHIP_RT_EXCEPTIONS: %s kahdesti" % _pg
    _rt_used[_pg] = _rt
for _pg, _sh in ships.items():
    if _pg in _rt_used:
        _sh["rt"] = _rt_used[_pg]
        continue
    _ty = _sh.get("ty")
    assert _ty in SHIP_RT_BY_TY, (
        "alus %s (%s) on tyyppia %r, jota kirja ei luokittele - lisaa rivi "
        "SHIP_RT_EXCEPTIONS-tauluun perusteluineen" % (_pg, _sh.get("nm"), _ty))
    _sh["rt"] = SHIP_RT_BY_TY[_ty]
check_ship_types(ships)
print("alustyyppeja (s.14): %s"
      % {k: sum(1 for _s in ships.values() if _s["rt"] == k)
         for k in ("battleship", "cruiser", "escort", "none")})

# --- 1.1 vaihe 4: Dominionin nimetty reservilupa (Fleets s.101) -------------
# "A Space Marine Dominion Fleet has close ties with nearby Imperial Navy
# forces. Contrary to the normal rules, a dominion fleet can take Imperial
# Navy vessels as normal reserves and reinforcements, including Adeptus
# Mechanicus and non-xenos Rogue Trader vessels."
#
# Rotuportti (s.15) estaisi taman: Dominion on rodultaan space marines.
# Kirja sanoo suoraan "contrary to the normal rules", joten lupa kirjataan
# listalle nimeltä. Listan kentta res_ok kertoo, mita lahteita se saa kayttaa
# oman rotunsa lisaksi; not_re rajaa rivit (s.101: "non-xenos").
#
# "For purposes of choosing reserves, battle barges count as battleships, and
# strike cruisers count as cruisers" - tama on jo voimassa, koska profiilin
# rt-kentta on luettu kirjasta samalla tavalla.
RESERVE_GRANTS = [
    dict(list="Space Marines \u2014 Dominion",
         src="Contrary to the normal rules, a dominion fleet can take Imperial "
             "Navy vessels as normal reserves and reinforcements, including "
             "Adeptus Mechanicus and non-xenos Rogue Trader vessels.",
         grants=[dict(race="imperial navy"),
                 dict(list="Rogue Traders", not_re="xenos"),
                 dict(list="Rogue Traders \u2014 Exploration", not_re="xenos"),
                 dict(list="Rogue Traders \u2014 Pirates and Wolf Packs", not_re="xenos")]),
]
# --- 1.1 vaihe 4: Eldar Corsairs <-> Iyanden (Fleets s.316 ja s.319) -------
# s.316: "An Eldar Hero must lead the fleet in order to use Craftworld Eldar
# vessels as reserves. Following this, one Craftworld Eldar Flame of Asuryan,
# Dragonship or Wraithship may be taken for every three cruisers in the fleet."
# s.319: "An Eldar Hero must lead the fleet in order to use Corsair Eldar
# vessels as reserves. Following this, one Corsair Eldar cruiser or light
# cruiser may be taken for every three Dragonships and / or Wraithships in the
# fleet."
#
# Eldar ja Craftworld Eldar ovat s.14:n rotuluettelossa ERI rotuja, joten
# yleinen rotuportti estaisi taman. Lupa on listakohtainen JA ehdollinen:
# laivastoa on johdettava Eldar Hero (tai Iyandenilla Prince Yriel, s.319:
# "Yriel may be taken instead of the Hero Fleet Commander"). Suhdeluvut ovat
# kirjan yleiset 1:3 tyypeittain, joten ne tulevat moottorista.
_ELDAR_HERO = "^(eldar hero|prince yriel)"
_CORS_SRC = ("An Eldar Hero must lead the fleet in order to use Craftworld "
             "Eldar vessels as reserves. Following this, one Craftworld Eldar "
             "Flame of Asuryan, Dragonship or Wraithship may be taken for every "
             "three cruisers in the fleet.")
_IYA_SRC = ("An Eldar Hero must lead the fleet in order to use Corsair Eldar "
            "vessels as reserves. Following this, one Corsair Eldar cruiser or "
            "light cruiser may be taken for every three Dragonships and / or "
            "Wraithships in the fleet.")
for _cnm in ("Eldar Corsairs \u2014 Gothic Sector",
             "Eldar Corsairs \u2014 Later Gothic War"):
    RESERVE_GRANTS.append(dict(
        list=_cnm, src=_CORS_SRC,
        grants=[dict(list="Eldar \u2014 Iyanden Craftworld", needs_re=_ELDAR_HERO,
                     needs_what="an Eldar Hero")]))
RESERVE_GRANTS.append(dict(
    list="Eldar \u2014 Iyanden Craftworld", src=_IYA_SRC,
    grants=[dict(list="Eldar Corsairs \u2014 Gothic Sector", needs_re=_ELDAR_HERO,
                 needs_what="an Eldar Hero"),
            dict(list="Eldar Corsairs \u2014 Later Gothic War", needs_re=_ELDAR_HERO,
                 needs_what="an Eldar Hero")]))

for _g in RESERVE_GRANTS:
    _L = _p18_list(_g["list"])
    for _x in _g["grants"]:
        if _x.get("list"):
            _p18_list(_x["list"])          # lahdelistan on oltava olemassa
        if _x.get("race"):
            assert _x["race"] in RACE_NAMES, _x["race"]
    _L["res_ok"] = _g["grants"]
    _L["res_src"] = _g["src"]
print("nimettyja reservilupia: %d listalle" % len(RESERVE_GRANTS))

# s.101: "When reserves are taken in this manner, the fleet can have up to
# twelve cruisers." Listan oma otsikkoraja on 0-10, joten section_count
# korvataan ehdollisella katolla. Ehto on ROOLI (reservi laivastossa), ei
# rivi, joten conditional_cap sai kentan cond_role.
_DOM = _p18_list("Space Marines \u2014 Dominion")
_dc = _p18_sec(_DOM, "Cruisers")
_old = [r for r in _DOM["secs"][_dc]["rules"]
        if r.get("kind") == "section_count" and r.get("max") == 10]
assert len(_old) == 1, "Dominionin risteilijaraja ei loydy tasan kerran"
_DOM["secs"][_dc]["rules"] = [r for r in _DOM["secs"][_dc]["rules"] if r is not _old[0]]
_DOM["secs"][_dc]["rules"].append(dict(
    kind="conditional_cap", ok=True, sec=[_dc], label=_old[0].get("label") or "Cruisers",
    pick=[dict(sec=_dc)], cond_role="reserve", max_unmet=10, max_met=12,
    src=_old[0]["src"] + " When reserves are taken in this manner, the fleet "
                         "can have up to twelve cruisers."))
print("Dominionin risteilijaraja: 10 ilman reserveja, 12 niiden kanssa (s.101)")

# J148: Inquisition-alukset isannan rajoihin. Ajetaan vasta tassa, koska
# Bakan paallekkainen reservisaanto poistetaan ja Dominionin risteilijaraja
# muutetaan ehdolliseksi katoksi vasta J104:n jalkeen.
_inq_hits = {}
for _nm, _ii in _inq_at.items():
    _inq_hits[_nm] = _inq_limits(_p18_list(_nm), _ii)
# Mihin rajoihin Inquisition-alukset laskevat isannalla: bc = taisteluristeilija-
# suhde, bs = taistelulaivasuhde, cru12/cru10 = risteilijaraja (Dominionilla
# ehdollinen katto 10/12, s.101). Space Marine -listoilla ei ole suhteita
# risteilijoihin, Exploratorilla ei taisteluristeilijoita eika risteilijarajaa.
assert _inq_hits == {
    "Imperial Navy \u2014 Gothic Sector": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Bastion Fleets": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Armageddon Sector": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Bakka Sector": ["bc", "bs", "cru12"],
    "Space Marines \u2014 Codex Astartes": ["cru10"],
    "Space Marines \u2014 Crusade": ["cru10"],
    "Space Marines \u2014 Dominion": ["cru10"],
    "Adeptus Mechanicus \u2014 Explorator": ["bs"],
}, _inq_hits
print("Inquisition-alukset isannan rajoihin: %d poimintaa (s.138, s.14)"
      % sum(len(v) for v in _inq_hits.values()))


# --- 1.1 vaihe 4: listat jotka eivat vaihda aluksia lainkaan (s.99, s.145) --
# "A Space Marine Crusade fleet will not take ships from or provide ships to
# any other fleet list as reserves or allies, including Imperial Navy, Rogue
# Trader or Adeptus Mechanicus fleet lists." Sama lause on Grey Knightsilla.
#
# Ilman tata kieltoa yleinen rotusaanto sallisi Crusaden ja Codex Astartesin
# vaihtaa aluksia: molemmat ovat rodultaan space marines. Kielto on
# molempiin suuntiin ("take ships from or provide ships to") ja voittaa myos
# s.139:n inkvisiittoriluvan, koska se on listan oma ja tasmallisempi.
RESERVE_BANS = [
    dict(list="Space Marines \u2014 Crusade",
         src="A Space Marine Crusade fleet will not take ships from or provide "
             "ships to any other fleet list as reserves or allies, including "
             "Imperial Navy, Rogue Trader or Adeptus Mechanicus fleet lists."),
    dict(list="Grey Knights",
         src="A Grey Knights fleet will not take ships from or provide ships to "
             "any other fleet list as reserves or allies, including Imperial "
             "Navy, Rogue Trader or Adeptus Mechanicus fleet lists."),
]
for _b in RESERVE_BANS:
    _L = _p18_list(_b["list"])
    _L["res_ban"] = _b["src"]
print("reservikieltoja: %d listalla" % len(RESERVE_BANS))

# Osittainen lainauskielto: lista antaa reserveja, mutta EI tiettyja
# rivejaan. Armageddon s.41: "Likewise, Imperial Navy fleets choosing
# reserves from this fleet list cannot choose Space Marine vessels from
# it." Space Marine -alukset on merkitty listalla tahdella ("* Space Marine
# vessels may not be squadroned with non-Space Marine vessels"), ja kaksi
# tahtea on eri asia (Endurance/Defiant, harvinaiset variantit) - siksi
# tasan yksi tahti nimen lopussa. Pistokoe 20, siemen 2026091413 (P1).
LEND_BANS = [
    dict(list="Imperial Navy \u2014 Armageddon Sector",
         re="[^*]\\*$",
         src="Likewise, Imperial Navy fleets choosing reserves from this "
             "fleet list cannot choose Space Marine vessels from it."),
]
for _b in LEND_BANS:
    _L = _p18_list(_b["list"])
    _L["lend_ban"] = dict(re=_b["re"], src=_b["src"])
print("osittaisia lainauskieltoja: %d listalla" % len(LEND_BANS))

# Saannon lahdelause ei saa jatkua hintariviin. Grey Knightsin s.146
# saattajalause paattyy "(see pg 13)" ilman pistetta, ja poiminta liimasi
# siihen seuraavan rivin "Rapid strike vessel (Firestorm) (pg 106) (pg
# 79)..45 pts" - pelaaja luki sen laillisuuspaneelissa saannon lauseena.
# Loytyi check_pages.py:lla 14.9.2026. Leikataan ensimmaisen hintarivin
# kohdalta ja paatetaan lause pisteeseen.
_PRICE_ROW = re.compile(r"\s+[A-Z][^.]{3,90}?\(pg\.?\s*\d+\)(?:\s*\(pg\.?\s*\d+\))?\s*\.{2,}\s*\+?\d+\s*pts.*$")
_GLUED = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _r in _sec.get("rules") or []:
            _src = _r.get("src")
            if not _src or not _PRICE_ROW.search(_src):
                continue
            _cut = _PRICE_ROW.sub("", _src).rstrip()
            if _cut and not _cut.endswith((".", "!", "?", ")")):
                _cut += "."
            elif _cut.endswith(")"):
                _cut += "."
            _r["src"] = _cut
            _GLUED += 1
print("hintariviin liimautuneita lahdelauseita leikattu: %d" % _GLUED)

# Chaos Space Marine -miehistot (s.234/236/240/244/248). Kaksi asiaa, jotka
# pistokoe 20 loysi: (1) s.222 kieltaa miehiston renegade-alukselta -
# "Chaos Space Marines ... may not be taken for Imperial Navy vessels used in
# this manner" - joten Imperial Navy -runko ei saa rivia (flno); (2) aluksella
# on yksi miehisto, ja kahden listan legioonanimiset rivit ovat sama ostos
# (grp), jotta lainalaivalle ei myyda kahta (siemen 2026091443).
_CREW = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _en in _sec.get("ents") or []:
            if _en.get("k") == "up" and str(_en.get("l", "")).endswith("Chaos Space Marine crew"):
                _c = _en.setdefault("cond", {})
                _c["flno"] = "^imperial navy"
                _en["grp"] = "crew"
                _CREW += 1
print("Chaos Space Marine -miehistorivit ehdollistettu: %d" % _CREW)

# Veil of Lust (s.248): rivin oma lause on kaksi virketta, ja toinen on
# mekaniikka. Osiolause kantoi vain ensimmaisen, joten kortti myi kyvyn
# ilman vaikutusta (pistokoe 20, siemen 2026091441).
_VEIL = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _en in _sec.get("ents") or []:
            if _en.get("k") == "up" and _en.get("l") == "Veil of Lust":
                _en["desc"] = ("Any ships with the Mark of Slaanesh may take and be obscured by a "
                               "Veil of Lust. Ship firing on this vessel using the gunnery table "
                               "suffers a right column shift before any other modifiers are applied.")
                _VEIL += 1
assert _VEIL == 1, _VEIL
print("Veil of Lust -kuvaus taydennetty")

# --- 1.1 vaihe 4: inkvisiittorin johtama laivasto (Fleets s.139) -----------
# "Any one of the Imperial Navy, Adeptus Mechanicus and Space Marine fleets
# led by an Inquisitor may always take ships from the other two as reserves in
# the normal manner."
#
# Ehto on sama Inquisitor Lord -rivi, joka lisattiin naille kahdeksalle
# listalle (J104). Crusade ja Grey Knights saavat luvan tassa kuten muutkin,
# mutta niiden oma kielto voittaa sen.
_INQ_RES_SRC = ("Any one of the Imperial Navy, Adeptus Mechanicus and Space "
                "Marine fleets led by an Inquisitor may always take ships from "
                "the other two as reserves in the normal manner.")
for _nm in _INQ_HOSTS:
    _L = _p18_list(_nm)
    _g = list(_L.get("res_ok") or [])
    _g += [dict(race="imperial navy", needs_re="^inquisitor lord",
                needs_what="an Inquisitor Lord"),
           dict(race="space marines", needs_re="^inquisitor lord",
                needs_what="an Inquisitor Lord")]
    _L["res_ok"] = _g
    if not _L.get("res_src"):
        _L["res_src"] = _INQ_RES_SRC
print("inkvisiittorin reservilupa: %d listalle" % len(_INQ_HOSTS))


# --- s.121: Mechanicus-alukset Space Marine -laivastoon EHDOITTA -----------
# "Adeptus Mechanicus vessels can be used as reserves in any Imperial Navy or
# Space Marine fleet list." Lupa on ehdoton, mutta Mechanicus on rodultaan
# imperial navy ja Space Marines oma rotunsa, joten yleinen rotuportti estaa
# sen. Ainoa Space Marine -listalle kirjattu lupa oli s.139:n
# inkvisiittoriehtoinen, joten sovellus vaati inkvisiittorin kirjan vastaisesti
# (Codex-katselmointi 15.9.2026). Imperial Navy -listat ovat jo samaa rotua,
# joten ne eivat tarvitse tata; res_ban (Crusade) on listan oma ja tarkempi.
_AM_LIST = "Adeptus Mechanicus \u2014 Explorator"
_AM_SRC = ("Adeptus Mechanicus vessels can be used as reserves in any Imperial "
           "Navy or Space Marine fleet list.")
_AM_N = 0
for _L in lists_out:
    if _L.get("race") != "space marines" or _L.get("res_ban"):
        continue
    _g = list(_L.get("res_ok") or [])
    if not any(x.get("list") == _AM_LIST and not x.get("needs_re") for x in _g):
        _g.append(dict(list=_AM_LIST))
        _L["res_ok"] = _g
        _AM_N += 1
_p18_list(_AM_LIST)                      # lahdelistan on oltava olemassa
assert _AM_N >= 1, _AM_N
print("s.121 Mechanicus-lupa: %d Space Marine -listalle" % _AM_N)


# --- liittolaismatriisi (Fleets s.17 + 2010 FAQ) --------------------------
# s.17: "no vessel can be allied to a fleet for which it is a natural enemy,
# nor can it ally itself to a fleet that already contains allies for which it
# is a natural enemy." Taulukko, joka kertoo kuka on kenenkin vihollinen, on
# otsikkona s.17:lla mutta ITSE TAULUKKO PUUTTUU tasta painoksesta (sivu on
# otsikon jalkeen tyhja, varmistettu renderoimalla). Remasteredin oma
# verkkoversio palauttaa sen ja merkitsee lahteen: "Editor's note: The
# following was taken from the 2010 FAQ."
#
# Sanatarkka teksti ja perustelut: referenssi/liittolaismatriisi_2010_faq.txt
#
# Matriisin luokat eivat ole sovelluksen rotuja: se erottaa Rogue Traders ja
# Demiurg/Kroot omiksi luokikseen. Siksi oma kentta ally_race, joka EI korvaa
# race-kenttaa (se vastaa s.14:n rotuluetteloon ja ratkaisee reservit).
ALLY_RACE = {
    "imperial navy": "imperials",
    "space marines": "space marines",
    "chaos": "chaos",
    "eldar": "corsair eldar",
    "craftworld eldar": "craftworld eldar",
    "dark eldar": "dark eldar",
    "orks": "orks",
    "necrons": "necrons",
    "tyranids": "tyranids",
    "tau": "tau",
}
# Listakohtaiset poikkeukset: matriisin oma luokka voittaa rodun.
ALLY_RACE_BY_LIST = {
    "Rogue Traders": "rogue traders",
    "Rogue Traders \u2014 Exploration": "rogue traders",
    "Rogue Traders \u2014 Pirates and Wolf Packs": "rogue traders",
    "Demiurg \u2014 War Host": "demiurg",
    "The Emperor's Inquisition": "imperials",
}
# never = ei koskaan naiden kanssa; only = vain naiden kanssa.
ALLY_MATRIX = {
    "imperials":        dict(never=["chaos", "dark eldar", "craftworld eldar", "orks"]),
    "chaos":            dict(never=["imperials", "craftworld eldar", "corsair eldar",
                                    "space marines", "tau"]),
    "tau":              dict(never=["orks", "chaos", "dark eldar", "space marines"]),
    "dark eldar":       dict(never=["imperials", "tau", "space marines"]),
    "craftworld eldar": dict(never=["imperials", "chaos", "space marines", "orks"]),
    "corsair eldar":    dict(never=["chaos", "space marines", "orks"]),
    "space marines":    dict(only=["imperials", "rogue traders"]),
    "rogue traders":    dict(never=["tyranids", "necrons"]),
    "orks":             dict(only=["chaos", "dark eldar", "rogue traders"]),
    "demiurg":          dict(never=["orks", "space marines"]),
    "necrons":          dict(only=[]),
    "tyranids":         dict(only=[]),
}
ALLY_SRC = "Allies Matrix (2010 FAQ, Fleets pg. 17 names it but does not print it)"
# Imperiumin toinen virke: Space Marine -liittolainen sulkee muut pois.
ALLY_EXCLUSIVE = dict(
    who="imperials", trigger="space marines", allow=["rogue traders"],
    src="Allies Matrix (2010 FAQ): If it allies with or has as allies the "
        "Space Marines, it cannot ally with or take as allies ships from any "
        "other fleet list except Rogue Trader vessels (excluding Xenos ships).")

# "excluding Xenos ships" sanotaan lahteessa kolmesti: Imperiumin rivilla,
# Space Marines -rivilla ja Rogue Tradersin rivilla. Kolmas on laajin eika
# koske vain liittolaisriveja - "may not take Xenos vessels when allied with
# Space Marines" kieltaa Xenos-alukset laivastosta, myos Rogue Traderin omat.
# Siksi tama on laivastotason ehto eika parin ehto, ja `when` on luokka jonka
# LASNAOLO laukaisee sen. Xenos-rivit ovat vain Rogue Traders -listoilla, joten
# saanto ei voi purra muualla.
ALLY_XENOS = dict(
    when="space marines", re="^Xenos Vessel",
    src="Rogue Traders: may ally with any fleet except Tyranids and Necrons "
        "but may not take Xenos vessels when allied with Space Marines. "
        "(Allies Matrix, 2010 FAQ)")

_AR = 0
for _L in lists_out:
    _ar = ALLY_RACE_BY_LIST.get(_L["nm"]) or ALLY_RACE.get(_L.get("race"))
    assert _ar, "liittolaisluokka puuttuu: %s (race %r)" % (_L["nm"], _L.get("race"))
    assert _ar in ALLY_MATRIX, _ar
    _L["ally_race"] = _ar
    _L["ally_rule"] = dict(ALLY_MATRIX[_ar], src=ALLY_SRC)
    if _ar == ALLY_EXCLUSIVE["who"]:
        _L["ally_excl"] = dict(ALLY_EXCLUSIVE)
    _L["ally_xenos"] = dict(ALLY_XENOS)
    _AR += 1
# Liitto on laillinen vain jos KUMPIKIN puoli sallii sen. Lahde kirjoittaa
# saannot yhteen suuntaan per luokka, joten yksipuolinen kielto riittaa -
# esimerkiksi "Necrons do not ally with any fleet" ei toistu Imperiumin
# rivilla. Siksi tassa ei vaadita symmetriaa vaan tarkistetaan lopputulos
# nimetyilla pareilla: kirjoitusvirhe taulukossa nakyy heti.
def _ok(a, b):
    r = ALLY_MATRIX[a]
    return (b in r["only"]) if "only" in r else (b not in r["never"])
def _pair(a, b):
    return _ok(a, b) and _ok(b, a)
_EXPECT = [
    ("imperials", "corsair eldar", True),   ("imperials", "craftworld eldar", False),
    ("imperials", "dark eldar", False),     ("imperials", "tau", True),
    ("imperials", "space marines", True),   ("imperials", "orks", False),
    ("imperials", "chaos", False),          ("orks", "chaos", True),
    ("orks", "dark eldar", True),           ("orks", "rogue traders", True),
    ("chaos", "dark eldar", True),          ("chaos", "corsair eldar", False),
    ("rogue traders", "tyranids", False),   ("rogue traders", "necrons", False),
    ("imperials", "necrons", False),        ("imperials", "tyranids", False),
    ("tau", "demiurg", True),               ("space marines", "demiurg", False),
    ("space marines", "corsair eldar", False), ("space marines", "rogue traders", True),
]
for _a, _b, _want in _EXPECT:
    assert _pair(_a, _b) == _want, (
        "liittolaismatriisi: %s + %s pitaisi olla %s" % (_a, _b, _want))
print("liittolaismatriisi: %d listalle, %d luokkaa" % (_AR, len(ALLY_MATRIX)))


# --- 1.1 vaihe 4: Rogue Trader -risteilija muihin laivastoihin (s.174) -----
# "Any fleet except Necrons or Tyranids may include a single Rogue Trader
# capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader
# cruiser for every 750 points or part thereof in their fleet. ... Rogue
# Trader cruisers always count against cruiser restrictions in any fleet list
# that has such restrictions."
#
# Rivi on Rogue Trader Cruiser (s.180, 185 p). Exploration-listan variantit
# (Dauntless, Endeavour) jaavat pois: ne ovat Rogue Trader -listan omia
# rivaja, ja kirjan toinen virke koskee nimenomaan toista risteilijaa
# Exploration-listalta - se on oma tapauksensa.
#
# Ulkopuolelle jaavat:
#   Necrons ja Tyranidit - kirja sanoo "except".
#   Rogue Trader -listat itse - rivi on niilla jo.
#   Bakka (s.50), Tau Commerce Protection (s.457) ja Demiurg (s.487) -
#     niilla on oma, tasmallisempi saantonsa samasta asiasta.
#   Space Marines Crusade ja Grey Knights - niiden oma kielto (s.99, s.145)
#     sanoo etteivat ne ota aluksia MISTAAN muualta.
_RT174_A = ("Any fleet except Necrons or Tyranids may include a single Rogue "
            "Trader capital ship.")
_RT174_B = ("Tau, Demiurg and Imperial fleets may include one Rogue Trader "
            "cruiser for every 750 points or part thereof in their fleet.")
_RT174_C = ("Rogue Trader cruisers always count against cruiser restrictions "
            "in any fleet list that has such restrictions.")
_RT_PER750 = ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Bastion Fleets",
              "Imperial Navy \u2014 Armageddon Sector", "Adeptus Mechanicus \u2014 Explorator",
              "Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Dominion",
              "The Emperor's Inquisition", "Tau \u2014 Merchant Fleet")
_RT_SINGLE = ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
              "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh",
              "Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War",
              "Eldar \u2014 Iyanden Craftworld", "Dark Eldar \u2014 Pirates",
              "Orks \u2014 Cyclops Cluster", "Orks \u2014 Waaagh!", "Orks \u2014 Da Ork Clanz")
_rt174 = 0
for _nm in _RT_PER750 + _RT_SINGLE:
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 180 for x in _L["secs"] for e in x["ents"]), \
        "%s: Rogue Trader Cruiser on jo" % _nm
    _i = len(_L["secs"])
    _per = _nm in _RT_PER750
    _rule = (dict(kind="per_points", each=1, per=750, ok=True, sec=[_i],
                  label="Rogue Trader cruisers (one per 750 pts or part)",
                  pick=[dict(sec=_i)], src=_RT174_B)
             if _per else
             dict(kind="cap", max=1, ok=True, sec=[_i],
                  label="Rogue Trader capital ships (0-1)",
                  pick=[dict(sec=_i)], src=_RT174_A))
    _L["secs"].append(dict(t="ROGUE TRADERS",
                           text=[_RT174_A, _RT174_B, _RT174_C],
                           ents=[_p18_unit("Rogue Trader Cruiser", 180, 185, 174)],
                           rules=[_rule]))
    # "always count against cruiser restrictions in any fleet list that has
    # such restrictions": listan oma risteilijaraja laskee taman mukaan.
    _cr = [j for j, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "cruisers"]
    if _cr:
        for _r in _L["secs"][_cr[0]].get("rules") or []:
            if _r.get("kind") == "section_count":
                _r["pick"] = (_r.get("pick") or [dict(sec=_cr[0])]) + [dict(sec=_i)]
                _r["src"] = _r["src"] + " " + _RT174_C
    _rt174 += 1
assert _rt174 == 21, _rt174
print("Rogue Trader -risteilija lisatty %d listalle (s.174)" % _rt174)


# --- J162: Abaddon neljalle jumalalistalle (Fleets s.231) -------------------
# Kayttajan paatos 13.10.2026. s.231 ABADDON AS FLEET COMMANDER: "Abaddon can
# be chosen to act as fleet commander in any game in which the Chaos fleet is
# worth 1,000 points or more." Lause ei rajaa listaa, ja Tzeentch-, Nurgle-,
# Khorne- ja Slaanesh-listojen oma Planet Killer -rivi varautuu haneen
# (s.237, 241, 245, 249: "If Abaddon is present, he must be aboard the Planet
# Killer"), samoin jumalten bargeiden profiilit (s.258: "unless the fleet is
# being led by Abaddon the Despoiler"). Niiden Fleet Commander -osiot eivat
# luettele hanta, joten rivi oli vain Black Crusadessa. Incursion-lista
# (s.232) ei mainitse hanta missaan eika kuulu paatokseen.
#
# Rivi KOPIOIDAAN Black Crusaden osiosta (yksi lahde: hinta 195 on painettu
# vain s.234:lle, Ld 10, yksi re-roll per vuoro). Osio lisataan listan
# loppuun ennen puolustusosiota, joten yksikaan osioindeksi ei siirry.
#
# Toinen puoli samaa paatosta: s.234 sanoo Black Crusadesta "worth more than
# 1,000 points", s.231 "1,000 points or more". Abaddonin oma yleissaanto
# (s.231) ratkaisee: tasan 1 000 pistetta riittaa myos Black Crusadessa.
_AB_SRC = ("Abaddon can be chosen to act as fleet commander in any game in which the "
           "Chaos fleet is worth 1,000 points or more.")
_AB_RR = "Abaddon’s fleet is allowed to re-roll a single Command check or Leadership test each turn."
_AB_LORD = "You may not place a Chaos Lord on the same ship as Abaddon."
_ab_bc = _p18_list("Chaos — Black Crusade")
_ab_sec = _ab_bc["secs"][_p18_sec(_ab_bc, "Abaddon")]
assert [(e["l"], e["p"], e["k"], e.get("rr")) for e in _ab_sec["ents"]] == [("Abaddon (Ld 10)", 195, "cmd", 1)], _ab_sec["ents"]
_ab_at = [r for r in _ab_sec["rules"] if r["kind"] == "allowed_at"]
assert len(_ab_at) == 1 and _ab_at[0].get("over") is True and _ab_at[0]["points"] == 1000, _ab_at
del _ab_at[0]["over"]
_ab_at[0]["src"] = _AB_SRC
add_text(_ab_sec, [_AB_SRC])
if _ab_sec.get("own") is not None:                # lause on osion, ei rivin oma
    _ab_sec["own"] = list(_ab_sec["own"]) + [None] * (len(_ab_sec["text"]) - len(_ab_sec["own"]))
    assert len(_ab_sec["own"]) == len(_ab_sec["text"])
_ab_n = 0
for _nm in ("Chaos — Tzeentch", "Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _L = _p18_list(_nm)
    assert not any("abaddon" in str(e["l"]).lower() for x in _L["secs"] for e in x["ents"]), "%s: Abaddon on jo" % _nm
    # Listan oma komentajaosio = se, jota Warmaster-pakko koskee.
    _md = [r for x in _L["secs"] for r in (x.get("rules") or []) if r.get("kind") == "mandatory_at"]
    assert len(_md) == 1 and "Chaos Warmaster" in _md[0]["src"], "%s: mandatory_at %s" % (_nm, _md)
    _cmds = sorted({q["sec"] for q in (_md[0].get("pick") or [])} | set(_md[0].get("sec") or []))
    assert len(_cmds) == 1 and _L["secs"][_cmds[0]]["t"].startswith("Chaos Warmaster"), "%s: komentajaosiot %s" % (_nm, _cmds)
    _cmd = _cmds[0]
    _i = len(_L["secs"])
    _e = copy.deepcopy(_ab_sec["ents"][0])
    _e["src_page"] = 231
    _L["secs"].append(dict(
        t="Abaddon", text=[_AB_SRC, _AB_LORD, _AB_RR], own=[None, None, "Abaddon (Ld 10)"],
        notes=["Page 231 lets Abaddon lead any Chaos fleet of 1,000 points or more. This list does not "
               "print a row for him; his price is the one printed in the Black Crusade list (p. 234)."],
        ents=[_e],
        rules=[dict(kind="allowed_at", points=1000, ok=True, sec=[_i], label="Abaddon",
                    pick=[dict(sec=_i)], src=_AB_SRC),
               # "act as fleet commander": Warmasterin tilalla, ei rinnalla
               # (s.234 sanoo saman Black Crusadessa: "as the Warmaster").
               dict(kind="cap", max=1, ok=True, sec=[_i], label="Warmaster or Abaddon",
                    pick=[dict(sec=_cmd), dict(sec=_i)], src=_AB_SRC)]))
    # ...ja pakollinen Warmaster tayttyy hanella.
    _md[0]["pick"] = list(_md[0].get("pick") or [dict(sec=j) for j in (_md[0].get("sec") or [])]) + [dict(sec=_i)]
    _ab_n += 1
assert _ab_n == 4, _ab_n
print("Abaddon lisatty %d jumalalistalle (s.231); Black Crusaden raja 1 000 pistetta tai enemman" % _ab_n)


# ------------------------------- osuus yhden rungon optiosta (s.437, J175 c)
# "Instead of taking one of the above, up to 10% of the Tyranid escort drones
# in the fleet can elect to become fireships." Optio on profiililla (sama
# drone_weapon-ryhma kuin aseet), mutta raja on laivaston: resolveFleet
# laskee runkoja, pyoristys alaspain.
_FS_SRC = ("Instead of taking one of the above, up to 10% of the Tyranid escort drones in the fleet "
           "can elect to become fireships.")
_fs_ol = [o for o in ships["437"]["ol"] if "become fireships" in str(o.get("t"))]
assert ships["437"]["nm"] == "ESCORT DRONE" and len(_fs_ol) == 1 and _fs_ol[0]["t"].startswith(_FS_SRC), _fs_ol
assert "frac" not in ships["437"]
ships["437"]["frac"] = dict(opt="become fireships", pct=10, what="437", pg=437, src=_FS_SRC,
                            label="Fire ship escort drones (up to 10% of the escort drones)")

# ------------------------------------- Webway Portal (s.337, J175 d)
# Havenin oma saanto: "The owning player may use the Webway to summon
# additional warships to its aid. Any number of ships may be purchased
# against the fleet's total at 50% cost, but they count as reserves and start
# off the table." Puolihintaisuus on aluksen ostotapa, joten se on rivi
# (pct -50) jokaiselle listan alukselle, ja se avautuu Hidena (off0) - ei
# avointa ruutua joka kortille. "count as reserves" = poydan ulkopuolelta
# saapuva (sama lause jatkuu "start off the table"), ei s.14:n listojen
# valinen reservi: "Any number". Haven on vain Eldar-listojen puolustuksissa
# (s.334); Dark Eldarin tukikohta (s.347) vaihtaa vain aseet, eika sivu
# mainitse portaalia - tulkinta, BACKLOG J175.
_WW_SRC = ("The owning player may use the Webway to summon additional warships to its aid. Any number of "
           "ships may be purchased against the fleet's total at 50% cost, but they count as reserves and "
           "start off the table.")
_WW_ARR = ("Beginning turn 2, after the Eldar fleet moves roll a D6. On a 5+, one capital ship or escort "
           "squadron appears along the table edge closest to the Eldar Haven. Eldar ships cannot move in "
           "the same turn they appear.")
_WW_LABEL = "Summoned through the Webway Portal (50% cost)"
_ww_n = 0
for _L in lists_out:
    if _L.get("race") not in ("eldar", "craftworld eldar"):
        continue
    assert not any(x["t"] == "WEBWAY PORTAL" for x in _L["secs"]), _L["nm"]
    _L["secs"].append(dict(
        t="WEBWAY PORTAL", text=[_WW_SRC, _WW_ARR], rules=[],
        notes=["Only with an Eldar Haven in the fleet (bought under Planetary defences, Fleets p. 334). "
               "Tick the row on each ship that arrives through the portal: it costs half, rounded up."],
        ents=[dict(l=_WW_LABEL, r=None, p=None, pct=-50, a=1, u=1, mx=None, nt=None, prose=1, k="up",
                   off0=1, cond=dict(ty=r"^(?!defence)"), src_page=337,
                   desc="Bought at 50% cost and starts off the table. " + _WW_ARR + " (Fleets p. 337)")]))
    _L["webway"] = dict(up="^" + _WW_LABEL.replace("(", "\\(").replace(")", "\\)") + "$",
                        haven="^Haven space station$", pg=337, src=_WW_SRC)
    _ww_n += 1
assert _ww_n == 3, _ww_n
print("Webway Portal: %d Eldar-listaa (s.337); fire ship -dronet enintaan 10 %% (s.437)" % _ww_n)


# ------------------------------- Pirates: kuljetukset (s.13, s.179; J46 b)
# s.13: "This rule exempts escorts that are allowed to operate alone, such as
# transports or Tau Messenger ships." Kirja sanoo itse, mitka Pirates-listan
# saattajista ovat kuljetuksia: Cargo Transport on "Transport" (s.85), Armed
# Freighter "counts as only half a freighter" (s.523) ja Armed Cargo Vessel
# "count as a half-transport" (s.192); Escort Carrier ja Q-Ship "do not count
# as freighters" (s.521, s.522). Kuljetus saa olla yksin, joten 3-6-saanto ei
# koske sita, eika yksin oleva kuljetus ole s.179:n "squadron of 3-6 escort
# vessels" risteilijaa kohti.
_PIR_TRANSPORTS = ("Cargo Transport", "Armed Freighter", "Armed Cargo Vessel")
_PIR_NOT_T = "^(?!(?:%s)$)" % "|".join(re.escape(x) for x in _PIR_TRANSPORTS)
_pir = [L for L in lists_out if L["nm"] == "Rogue Traders \u2014 Pirates and Wolf Packs"]
assert len(_pir) == 1
_pe = [i for i, s in enumerate(_pir[0]["secs"]) if s["t"].strip().upper() == "ESCORTS"]
assert len(_pe) == 1
_pe = _pe[0]
_labs = [e["l"] for e in _pir[0]["secs"][_pe]["ents"] if e.get("k") != "up"]
assert all(x in _labs for x in _PIR_TRANSPORTS), _labs
_pr = {r["kind"]: r for r in _pir[0]["secs"][_pe]["rules"]}
assert set(_pr) >= {"squadron", "min_ratio"} and "pick" not in _pr["squadron"], _pr.keys()
_pr["squadron"]["pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
_pr["squadron"]["src"] = (_pr["squadron"]["src"] + " This rule exempts escorts that are allowed to operate "
                          "alone, such as transports or Tau Messenger ships. (Fleets p. 13)")
_ap = _pr["min_ratio"]["allow_pick"]
assert _ap == [dict(sec=_pe)], _ap
_pr["min_ratio"]["allow_pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
print("Pirates: kuljetukset (%s) vapaat laivuesaannosta (s.13)" % ", ".join(_PIR_TRANSPORTS))


# ============================================ PLANETARY DEFENCES (s.496-517)
# Kayttajan paatos 8.10.2026: puolustukset omana osionaan JOKAISEN listan
# lopussa ("oma sarake viimeiseksi"). Osio lisataan viimeiseksi, koska
# saannot viittaavat osioihin numerolla (AGENTS.md 6): loppuun lisatty osio
# ei siirra yhtaan indeksia.
#
# Kuka saa mita - kirjan mukaan, ei yksi lista kaikille:
#   - s.499 hintalista (HIGH ORBIT / LOW ORBIT DEFENCES) ei nimea rotua, ja
#     Rulebook s.100 sanoo "All races have equivalents to these planetary
#     defences": yleinen rivisto jokaiselle listalle - PAITSI
#   - Tau: "The Tau may spend their points allocation for planetary defences
#     on orbitals" (s.451) ja "The Tau may not use any other form of
#     planetary defence" (s.452). Kaksi Tau-listaa saavat VAIN orbitaalinsa
#     (s.478-481). Demiurg War Host on eri luku (s.482-487), jonka saannot
#     eivat toista kieltoa: se saa yleisen rivisto (tulkinta, BACKLOG J170).
#   - Ramilies: "The Ramilies is available to Imperial and Chaos Fleets"
#     (s.500). Imperial = Imperial Navy -rodun listat (s.14 "Imperial Navy
#     (including Adeptus Mechanicus)"); Space Marineilla on oma
#     Fortress-Monastery (s.98, s.110), muista kirja ei sano mitaan.
#   - Haven: s.334 on ELDAR-luvun asema; Corsair- ja Craftworld-listat.
#     Dark Eldar saa sen vain aseet vaihdettuina (s.337, s.347).
#
# Rivin tyyppi:
#   r = profiili   -> tavallinen yksikkorivi
#   r = None, rc   -> ei profiilia: Orbital mine (s.512) ja Minefield (s.513)
#                     ovat pelkkia saantoja. k="unit" (ei paivitys), cnt=1 =
#                     ostetaan kappaleittain, rc = saantokortin avain
#                     (domain.js RULE_CARDS).
_PD_TITLE = "PLANETARY DEFENCES"
_PD_SQ = ("Orbital defences or ships that count as defences may be placed in squadrons, "
          "with 1HP defences grouped in up to six units and larger defences grouped in up to four.")
_PD_TEXT = [
    "When desired, the defender in a scenario may spend up to one-third of his allocated "
    "point value on planetary defences, in addition to any planetary defences provided by "
    "the specific scenario.",
    "However, these additional defences come directly from the points allowed against his "
    "or her fleet list.",
    "Alternatively, you can decide beforehand that you'll be fighting near to a planet, in "
    "which case the defending player may buy planetary defences out of their normal points "
    "value - a small planet can have no more than 4 planetary defences, a medium planet can "
    "have a maximum of 5 planetary defences and a large planet a maximum of 6.",
    "It is also a good idea to put an upper limit on the amount of points that can be spent "
    "(for example, in a standard battle perhaps no more than 10% of the fleet's points may "
    "be spent on planetary defences).",
    "Stationary planetary defences may be placed in base contact if desired, but they can "
    "never be stacked or have their bases overlap other stationary planetary defences.",
    "Low orbit defences may only be deployed on the low orbit table.",
]
_PD_NOTES = [
    "Defences are bought from the fleet's points and count against the points limit. A "
    "scenario's own allowance (D6x10 pts per 500 pts of fleet, Rulebook pp. 132, 136, 140) "
    "is extra: raise the points limit by the amount you rolled.",
    "Defence points are left out when a list rule asks what the fleet is worth (commander "
    "needed over 750 pts, one per 500 pts and so on), and defences are not escorts or "
    "reserves of the fleet list.",
    "One-hit defences are bought as squadrons of 1-6 on one card (Rulebook p. 100); a card "
    "holds one type.",
]
_PD_HIGH = [
    # (rivin nimi, profiili, pts, mx)  - jarjestys ja rajat s.499
    ("Orbital defence laser platform", "509", 30, None),
    ("Orbital torpedo launcher", "510", 30, None),
    ("Orbital weapons platform", "511", 30, None),
    ("Orbital mine", None, 5, None),
    ("Minefield", None, 40, 2),
    ("Fire ship", "516", 10, 6),
    ("System ship", "515", 20, None),
    ("Defence monitor", "514", 60, None),
    ("Orbital dock", "508", 90, None),
    ("Space station", "507", 150, None),
    ("Blackstone fortress", "506", 400, None),
]
_PD_LOW = [
    ("Defence laser silo", "517b", 15, 8),
    ("Missile silo", "517c", 5, 8),
    ("Air base", "517", 20, 4),
]
_PD_RC = {"Orbital mine": ("orbital_mine", 512), "Minefield": ("minefield", 513)}
#: 1 HP -puolustus, jota Rulebook s.100:n laivuelause koskee ("Orbital
#  defences or ships that count as defences"). Maakohteet (s.517) eivat ole
#  kumpaakaan, joten laivuesaanto ei nimea niita.
_PD_SQ_RE = "^(orbital defence laser platform|orbital torpedo launcher|orbital weapons platform|fire ship|system ship|defence monitor)$"


def _pd_row(label, ref, pts, page, mx=None, nt=None):
    e = dict(l=label, r=None, p=pts, src_page=page, a=0, mx=mx, nt=nt, k="unit")
    if ref is None:
        _rc, _pg = _PD_RC[label]
        e["rc"] = _rc
        e["cnt"] = 1
        e["src_page"] = _pg
        return e
    assert str(ref) in ships, "alus %r puuttuu" % ref
    e["r"] = int(ref) if str(ref).isdigit() else str(ref)
    return e


def _pd_generic():
    return ([_pd_row(l, r, p, 499, mx=mx) for l, r, p, mx in _PD_HIGH]
            + [_pd_row(l, r, p, 499, mx=mx) for l, r, p, mx in _PD_LOW])


_PD_RAMILIES_NT = ("Bought from the fleet's points, rather than defences; in competitive "
                   "play only by prior agreement (Fleets p. 500).")
_PD_TAU = [
    ("Kor caste orbital city", "478", 150, 478, None),
    ("Security orbital", "479", 50, 479, None),
    ("Orbitals (core module)", "480", 20, 480,
     "Core module 20 pts plus up to four modules, chosen below: a security module costs "
     "its defence system and adds +1 turret, manufacturing & research +10 (+1 shield, to "
     "3; tracking system), habitat +5 (+1 damage point) (Fleets p. 480)."),
    ("Waystation", "481", 0, 481,
     "The Waystation costs what its one defence system costs: choose it below (Fleets p. 481)."),
]
_PD_TAU_TEXT = [
    "Orbitals can be used when planetary defences are allowed.",
    "The Tau may spend their points allocation for planetary defences on orbitals.",
    "Tau Orbitals follow all High Orbit and Satellite defence rules.",
    "The Tau may not use any other form of planetary defence.",
] + _PD_TEXT[:2]
# s.360 ORK PLANETARY DEFENCES (J172): "Ork Roks can be taken as planetary
# defences and purchased using planetary defence point allowances ... Ork Roks
# cannot move and count as stationary in all effects when purchased as
# defences". Sama runko kuin listan oma Rok (s.392), mutta puolustuksena:
# oma avain, jotta df-lippu ei vie listan Rokilta paivityksia eika
# liikesaantoja. Nopeus 0 cm kertoo kortilla ja domainissa, ettei se liiku.
# Rokin omat saannot (s.393: kriitti +1 vahinko, hajoaa 4 Blast markeriksi)
# jaavat: "Roks are sufficiently different to both Orbital Defences and true
# spaceships to require a number of special rules" (tulkinta, BACKLOG J172).
assert "392d" not in ships and ships["392"]["nm"] == "ROK" and ships["392"]["sp"] == "10 cm", ships["392"]
ships["392d"] = dict(ships["392"])
ships["392d"]["aw"] = [list(a) for a in ships["392"]["aw"]]
ships["392d"]["ol"] = []
ships["392d"]["sp"] = "0 cm"
ships["392d"]["tn"] = "–"
# s.480 TAU ORBITALS (J171): "no more than four other modules can be added to a
# single core. An Orbital costs points equal to its core module plus the sum of
# any other modules added." Neljasta turvajarjestelmasta tuli maaraoptioita
# (sama teksti, sama option-ID - tallenteet sailyvat), ja jokainen tuo +1
# tornin ("Each security module adds +1 turret to the Core module"). Valmistus
# +10: "raises the array's shield value by 1 (to a maximum of 3)" - pohja 1,
# joten enintaan kaksi; "acts as a tracking system". Habitaatti +5: "adds 1 to
# the damage points". modmax = koko ryhman raja; domain laskee maarat yhteen.
_o480 = ships["480"]["ol"]
assert [o["t"] for o in _o480] == ["Launch Bay +10 pts", "Gravitic hook +5 pts (Orca/Warden needs to be purchased separately)",
                                   "Railgun battery +15 pts", "Ion Cannon Turret +15 pts"], [o["t"] for o in _o480]
assert ships["480"]["sh"] == "1" and ships["480"]["hp"] == 4, ships["480"]
for _o in _o480:
    assert _o.get("grp") == "480_defence" and _o.get("gmax") == 1, _o
    del _o["grp"], _o["gmax"]
    _o["qty"] = dict(max=4)
    _o["mod"] = dict(tu=1)
    _o["mods"] = 1
for _t, _c, _mx, _md in (("Manufacturing & Research module +10 pts: +1 shield (to a maximum of 3); "
                          "the module's drone intelligences act as a tracking system", 10, 2, dict(sh=1)),
                         ("Habitat module +5 pts: +1 damage point", 5, 4, dict(hp=1))):
    _o480.append(dict(t=_t, c=_c, var=0, qty=dict(max=_mx), mod=_md, mods=1, id=_opt_id("480", _t)))
ships["480"]["modmax"] = dict(n=4, pg=480, src="Normally individual orbital modules are assembled into arrays of up "
                              "to five. In any event the first module of any orbital array must be the core module "
                              "and no more than four other modules can be added to a single core.")
_PD_ROK_NT = ("A Rok bought as a planetary defence cannot move (Fleets p. 360). Roks squadron only "
              "with other Roks, up to four (p. 367).")
_pd_n = dict(generic=0, ramilies=0, haven=0, tau=0)
for _L in lists_out:
    assert not any(x["t"].strip().upper() == _PD_TITLE for x in _L["secs"]), \
        "%s: %s on jo" % (_L["nm"], _PD_TITLE)
    _i = len(_L["secs"])
    _race = _L.get("race")
    _is_tau = _L["nm"].startswith("Tau ")
    if _is_tau:
        _ents = [_pd_row(l, r, p, pg, nt=nt) for l, r, p, pg, nt in _PD_TAU]
        _text, _rules = list(_PD_TAU_TEXT), []
        _pd_n["tau"] += 1
    else:
        _ents = _pd_generic()
        _text = list(_PD_TEXT)
        _rules = [dict(kind="squadron", min=1, max=6, ok=True, sec=[_i],
                       label="Defence squadrons (1-6 one-hit defences)",
                       pick=[dict(sec=_i, re=_PD_SQ_RE)], src=_PD_SQ)]
        _pd_n["generic"] += 1
        if _race in ("imperial navy", "chaos"):
            _ents.append(_pd_row("Ramilies class star fort", "500", 875, 500, nt=_PD_RAMILIES_NT))
            _text.append("The Ramilies is available to Imperial and Chaos Fleets, subject to the rules below.")
            _pd_n["ramilies"] += 1
        if _race in ("eldar", "craftworld eldar"):
            _ents.append(_pd_row("Haven space station", "334", 200, 334))
            _pd_n["haven"] += 1
        if _race == "dark eldar":
            _ents.append(_pd_row("Haven space station (pirate base)", "334b", 200, 347))
            _pd_n["haven"] += 1
        # s.360: "Instead of using the Imperial Blackstone Fortress, Orks use
        # a non-moving Space Hulk" - sama profiili ja hinta, eri malli.
        if _race == "orks":
            _bs = [e for e in _ents if e["l"] == "Blackstone fortress"]
            assert len(_bs) == 1
            _bs[0]["nt"] = ("Orks field a non-moving Space Hulk in its place, on the same "
                            "profile and points cost (Fleets p. 360).")
            _ents.append(_pd_row("Rok", "392d", 80, 360, nt=_PD_ROK_NT))
            _pd_n["orks"] = _pd_n.get("orks", 0) + 1
    _L["secs"].append(dict(t=_PD_TITLE, text=_text, notes=list(_PD_NOTES), rules=_rules, ents=_ents))
assert _pd_n == dict(generic=30, ramilies=11, haven=4, tau=2, orks=3), _pd_n

# Profiililiput. Jokainen osuu tasan kerran, ja jokainen osioon myyty
# profiili saa df:n - muuten listan paivitykset vuotaisivat sille.
#   df  = planetary defence -profiili: ei listan paivityksia, ei listan
#         nimella kytkettyja runkosaantoja, ei laivaston escort
#   sq  = 1 HP -puolustus, jonka tyyppi ei ole Escort: ostetaan 1-6 kpl
#         yhdelle laivuekortille (Rulebook s.100). Defence monitor, system
#         ship ja fire ship ovat jo tyyppia Escort.
#   dld = kiintea Leadership. 7: "do not roll for leadership or have a
#         leadership value ... reload ordnance (where applicable) on a
#         nominal leadership of 7" (s.499, Rulebook s.100); Tau-orbitaalit
#         "follow all High Orbit and Satellite defence rules" (s.451).
#         10: Fortress-Monastery "base leadership of 10" (s.111).
#         Ramilies heittaa kuten capital ship (s.503) ja Haven Eldar-
#         saannoin (s.336): ei kenttaa.
#   dor = sallitut special orderit. RO+BFI: "cannot take on any special
#         orders except Reload Ordnance, though they may also attempt to
#         Brace For Impact" (s.499). RO+LO+BFI: Ramilies s.503,
#         Fortress-Monastery s.110-111, Haven s.336.
_PD_FLAGS = [
    # avain, df, sq, dld, dor
    ("500", 1, 0, None, "RO LO BFI"),
    ("110", 0, 0, 10, "RO LO BFI"),
    ("334", 1, 0, None, "LO RO BFI"), ("334b", 1, 0, None, "LO RO BFI"),
    ("506", 1, 0, 7, "RO BFI"), ("507", 1, 0, 7, "RO BFI"), ("508", 1, 0, 7, "RO BFI"),
    ("509", 1, 1, 7, "RO BFI"), ("510", 1, 1, 7, "RO BFI"), ("511", 1, 1, 7, "RO BFI"),
    ("514", 1, 0, 7, "RO BFI"), ("515", 1, 0, 7, "RO BFI"), ("516", 1, 0, 7, "RO BFI"),
    ("517", 1, 1, 7, "RO BFI"), ("517b", 1, 1, 7, "RO BFI"), ("517c", 1, 1, 7, "RO BFI"),
    ("478", 1, 0, 7, "RO BFI"), ("479", 1, 0, 7, "RO BFI"),
    ("480", 1, 0, 7, "RO BFI"), ("481", 1, 0, 7, "RO BFI"),
    # s.360: Rok puolustuksena "Reload Ordnance and Brace For Impact, for
    # which they are Leadership 7"; muut testit menevat lapi automaattisesti.
    ("392d", 1, 0, 7, "RO BFI"),
]
_pd_seen = set()
for _k, _df, _sq, _dld, _dor in _PD_FLAGS:
    assert _k in ships and _k not in _pd_seen, "PD_FLAGS: %s" % _k
    _pd_seen.add(_k)
    if _df:
        ships[_k]["df"] = 1
    if _sq:
        assert ships[_k]["hp"] == 1 and ships[_k]["ty"] != "Escort", _k
        ships[_k]["sq"] = 1
    if _dld:
        ships[_k]["dld"] = _dld
    ships[_k]["dor"] = _dor.split()
ships["516"]["rc"] = "fire_ship"
# s.481: "Choose one of the defence systems below. This defines the point cost
# for the waystation." Ryhmalla oli vain ylaraja (gmax 1): ilman valintaa
# Waystation maksoi 0 pistetta ja meni lapi (katselmointi 9.10.2026).
# need1 = ryhma, josta on otettava tasan yksi; resolveFleet tarkistaa.
assert {o.get("grp") for o in ships["481"]["ol"]} == {"481_defence"}, ships["481"]["ol"]
ships["481"]["need1"] = dict(grp="481_defence", what="defence system", pg=481,
                             src="Choose one of the defence systems below. This defines the point cost for the waystation.")
# s.503: "A Ramilies also has a single command check re-roll" - hinnassa.
# Fortress-Monastery: s.111 puhuu vain ostetuista re-rolleista, eika kirja
# sano periiko se taman (s.110 "follows all rules for the Ramilies"): auki,
# BACKLOG J164.
assert not ships["500"].get("rr")
ships["500"]["rr"] = 1
# J168 b: komentaja kyydissa -> linnakkeen re-rollit ovat hanen ja koko
# laivaston: Ramilies s.503 ("joins his re-rolls"), Fortress-Monastery s.111
# "re-rolls purchased by the fortress-monastery are added to the commander's
# own re-rolls and can be used by the entire fleet".
ships["500"]["rrj"] = 503
ships["110"]["rrj"] = 111
_pd_sold = {str(e["r"]) for _L in lists_out for _s in _L["secs"] if _s["t"] == _PD_TITLE
            for e in _s["ents"] if e.get("r")}
_pd_nodf = sorted(k for k in _pd_sold if not ships[k].get("df"))
assert not _pd_nodf, "planetary defences -osion profiili ilman df-lippua: %s" % _pd_nodf
_pd_df = {k for k, v in ships.items() if v.get("df")}
assert _pd_df == _pd_sold, "df-lippu profiililla, jota osio ei myy: %s" % sorted(_pd_df ^ _pd_sold)
# Osion ulkopuolella df-profiilia ei saa myyda: silloin rivi menettaisi listan
# paivitykset huomaamatta.
_pd_out = sorted("%s / %s / %s" % (_L["nm"], _s["t"], e["l"]) for _L in lists_out for _s in _L["secs"]
                 if _s["t"] != _PD_TITLE for e in _s["ents"] if e.get("r") and str(e["r"]) in _pd_df)
assert not _pd_out, "df-profiili osion ulkopuolella: %s" % _pd_out
print("planetary defences: osio %d listalla (yleinen %d, Ramilies %d, Haven %d, Tau %d), df-profiileja %d"
      % (sum(_pd_n[k] for k in ("generic", "tau")), _pd_n["generic"], _pd_n["ramilies"],
         _pd_n["haven"], _pd_n["tau"], len(_pd_df)))

# ------------------------------------------- osion laji (Fleets s.14 ja s.15)
# Fleets s.14: "the restrictions on maximum and minimum numbers of ships are
# determined for the fleet as a whole, regardless of whether they were
# purchased from the list or as reserves." Lainalaivan on siis laskeuduttava
# isantalistan kiintioihin - mutta MIHIN niista?
#
# Sovellus laskee osioittain, kirja tyypeittain. Silta niiden valilla on osion
# OTSIKKO: se on kirjan oma tapa luokitella alus siina listassa, jossa alus on
# painettu. Osio on siksi joko
#
#   "type"  = otsikko nimeaa aluslajin (Cruisers, Battleships, ESCORTS...).
#             Toisen listan alus, joka on omalla listallaan saman otsikon alla,
#             lasketaan tahan.
#   "own"   = otsikko nimeaa tietyt listan OMAT alukset (Planet Killer,
#             Chaos Space Hulk, Fortress-Monastery). Naihin ei lasketa toisen
#             listan aluksia, mutta ne ovat listan omia aluksia.
#   "reserve" = listan oma reserviosio: alukset ovat jonkun TOISEN listan.
#             s.15: "a given fleet list cannot take as reserves ships listed
#             as reserves or allies to another fleet list ... you cannot use a
#             reserve of a reserve."
#   "access" = listan nimetty paasy toisen RODUN aluksiin (Kroot Vessels,
#             Demiurg Vessels, Nicassar, Rogue Traders, Tau Escorts, Stryxis).
#             s.15: "These may only be taken exactly as described on their
#             fleet list rules and may not also be taken as reserves."
#
# reserve ja access kayttaytyvat laskennassa kuten own - niihin ei lasketa
# lainalaivoja - ja lisaksi niiden rivit eivat kelpaa lainattavaksi lainkaan.
#
# Paatos T34 (14.9.2026): lainalaiva luokitellaan sen otsikon mukaan, jonka
# alla se on OMALLA listallaan. Kirjan oma esimerkki s.14 laskee reservina
# otetun grand cruiserin isannan grand cruiser -kiintioon, eli lajin mukaan;
# kun listojen otsikot eroavat (Bastion painaa grand cruiserit otsikon
# "Battleships" alle), lahdelistan oma otsikko ratkaisee, koska se on kirjan
# oma luokittelu juuri sille alukselle. Jos vastaavaa otsikkoa ei isannalla
# ole, alus ei laskeudu mihinkaan kiintioon - alilaskenta on turvallisempi
# kuin vaara kiintio, ja se nakyy laivastonakymassa rivina.
SECTION_KINDS = ("type", "own", "reserve", "access", "defence")
SECTION_KIND = [
    # --- aluslajit -------------------------------------------------------
    ("battleships", "type", "kirjan aluslaji"),
    ("battlecruisers", "type", "kirjan aluslaji"),
    ("cruisers", "type", "kirjan aluslaji"),
    ("heavy cruisers", "type", "kirjan aluslaji"),
    ("grand cruisers", "type", "kirjan aluslaji"),
    ("escorts", "type", "kirjan aluslaji"),
    ("capital ships", "type", "kirjan aluslaji (tyranidit)"),
    ("battle barges", "type", "Space Marine -listojen aluslaji"),
    ("battleships & battlekroozers", "type", "orkkien aluslaji"),
    ("kroozers", "type", "orkkien aluslaji"),
    ("hive ships", "type", "tyranidien aluslaji"),
    ("kraken", "type", "tyranidien aluslaji"),
    ("vanguard drone ships", "type", "tyranidien aluslaji"),
    ("tombships", "type", "necronien aluslaji"),
    ("wraithships", "type", "eldarien aluslaji"),
    ("dragonships", "type", "Iyandenin aluslaji"),
    ("raiders", "type", "aluslaji"),
    ("big ship skwadron", "type", "Clanz-listan skwadronimalli on aluslaji"),
    ("‘uge ship skwadron", "type", "Clanz-listan skwadronimalli on aluslaji"),
    ("tiddla skwadron", "type", "Clanz-listan skwadronimalli on aluslaji"),
    # --- nimetyt alukset ja nimetty paasy --------------------------------
    ("planet killer", "own", "yksi nimetty alus"),
    ("chaos space hulk", "own", "yksi nimetty alus omine ehtoineen (s.288)"),
    ("space hulks", "own", "nimetty alus omine ehtoineen"),
    ("ork roks", "own", "nimetty alus"),
    ("roks", "own", "nimetty alus"),
    ("activated blackstone fortress", "own", "yksi nimetty alus"),
    ("fortress-monastery", "own", "yksi nimetty asema (s.98)"),
    ("stryxis caravan vessels", "access", "listan oma nimetty rivi"),
    ("kroot vessels", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("the kroot", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("demiurg vessels", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("the demiurg", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("nicassar vessels", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("nicassar escorts", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("tau escorts", "access", "nimetty paasy toisen rodun aluksiin (s.15)"),
    ("rogue traders", "access", "nimetty paasy (s.174)"),
    ("rogue trader escorts", "access", "nimetty paasy (s.174)"),
    ("transports", "own", "Rogue Trader -listan oma kuljetusosio"),
    ("reserves", "reserve", "listan oma reserviosio: alukset ovat toisen listan"),
    ("ordo malleus reserves", "reserve",
     "J144 s.142: Ordo Malleus -inkvisiittorin johtaman laivaston Bastion-"
     "listan Chaos-rungot; sama 1:3-budjetti kuin muilla reserveilla"),
    ("the reserve fleets of segmentum obscurus", "reserve",
     "Bastionin oma reserviosio (s.39): viisi Chaos-runkoa, jotka kuluttavat "
     "saman 1:3-budjetin kuin muualta lainatut alukset"),
    ("notes from nate montes", "own", "saantolaatikko, ei aluslaji"),
    # s.222: "do not count as reserves" ja s.15: nimetty paasy toisen rodun
    # aluksiin "may not also be taken as reserves". Oli own, jolloin reservin
    # reservi -tarkistus ei osunut (pistokoe 20, siemenet 2026091421/23/42).
    ("renegade imperial vessels", "access",
     "Chaos-listan omat renegaattirivit (s.222): 'they count as Chaos vessels "
     "in all respects', joten ne eivat ole reserveja eivatka lainattavissa"),
    ("xenos allies", "access",
     "Rogue Tradersin nimetty paasy Demiurgin ja Krootin aluksiin (s.175)"),
    ("the inquisition", "access",
     "listan nimetty paasy Inquisition aluksiin (s.138); ei aluslaji eika "
     "lainattavissa toiseen laivastoon"),
    # Viides laji (8.10.2026). Planetary defences ei ole laivastolistan osa
    # vaan kirjan oma luku (s.496-517), jonka rivit ostetaan s.499:n
    # hintalistalta. Oma laji, koska moottori tarvitsee yhden kytkimen: ei
    # listan paivityksia, ei reserveja kumpaankaan suuntaan, ei escort- eika
    # pistekynnyslaskentaan (domain.js resolveFleet, m.defence).
    ("planetary defences", "defence",
     "kirjan oma luku s.496-517; rivit s.499:n hintalistalta, ei laivastolistalta"),
]

_KIND = {}
for _t, _k, _why in SECTION_KIND:
    assert _t not in _KIND, "SECTION_KIND: %r kahdesti" % _t
    assert _k in SECTION_KINDS, _k
    _KIND[_t] = [_k, 0]
for _L in lists_out:
    for _sec in _L["secs"]:
        _has = any(e.get("r") and e.get("k") != "up" for e in (_sec.get("ents") or []))
        if not _has:
            continue
        _key = _sec["t"].strip().lower()
        assert _key in _KIND, (
            "osiota %r (%s) ei ole luokiteltu: lisaa rivi SECTION_KIND-tauluun. "
            "type = kirjan aluslaji, own = nimetyt alukset tai nimetty paasy"
            % (_sec["t"], _L["nm"]))
        _sec["ct"] = _KIND[_key][0]
        _KIND[_key][1] += 1
_unused_kind = [t for t, v in _KIND.items() if not v[1]]
assert not _unused_kind, "SECTION_KIND: kayttamattomia rivaja %s" % _unused_kind


def check_section_kinds(lists):
    """Aluksellisella osiolla on oltava laji. Luokittelematon osio ei saa
    jaada oletukselle: silloin lainalaiva joko laskeutuisi vaaraan kiintioon
    tai jaisi hiljaa laskematta."""
    bad = []
    for Lz in lists:
        for sec in Lz["secs"]:
            if any(e.get("r") and e.get("k") != "up" for e in (sec.get("ents") or []))                and sec.get("ct") not in SECTION_KINDS:
                bad.append("%s / %s" % (Lz["nm"], sec["t"]))
    assert not bad, "osion laji (ct) puuttuu: %s" % bad[:5]


check_section_kinds(lists_out)
print("osioita luokiteltu: %s"
      % {k: sum(1 for _L in lists_out for _s in _L["secs"] if _s.get("ct") == k)
         for k in SECTION_KINDS})

# --- J213: osion otsikoksi poimitut lauseen alut (docs/check-yourself) -----
# Poimija luki kirjan lyhyen rivin otsikoksi: "Marine crew may be" (s.242,
# 246, 250), "Space Marine Chapters are fiercely" (s.139) ja "The Rogue Trader
# cruiser profile" (s.174). Katalogiin syntyi osio, jonka nimi on lauseen
# keskelta. Lause kootaan kirjan sanoin; kaksi ensimmaista siirtyvat
# edelliseen osioon (tyhja osio ei nay missaan), kolmas saa kirjan oman
# valiotsikon. Osioiden indeksit eivat muutu, joten viittaukset pysyvat.
def _frag_fix(nm, frag_t, first, into_t=None, new_t=None):
    _L = _p18_list(nm)
    _fi = _p18_sec(_L, frag_t)
    _F = _L["secs"][_fi]
    assert not _F.get("rules"), "%s / %s: osiolla on saantoja" % (nm, frag_t)
    _tx = list(_F.get("text") or [])
    assert _tx and first.endswith(_tx[0][-40:]), "%s / %s: lause ei ole odotettu: %r" % (nm, frag_t, _tx[:1])
    _tx[0] = first
    if new_t:
        _F["t"], _F["text"] = new_t, _tx
        return
    _T = _L["secs"][_p18_sec(_L, into_t)]
    _n0 = len(_T.get("text") or [])
    _own = (_T.get("own") or [None] * _n0) + (_F.get("own") or [None] * len(_tx))
    _T["text"] = (_T.get("text") or []) + _tx
    if any(_own):
        _T["own"] = _own
    _T["ents"] = (_T.get("ents") or []) + (_F.get("ents") or [])
    _F["text"], _F["ents"] = [], []
    _F.pop("own", None)
_CSM_TH = ("A ship with a Chaos Space Marine crew may be equipped with Thunderhawk Gunships but if so it may only "
           "carry Thunderhawks and may not launch Swiftdeaths, Doomfires and Dreadclaws.")
for _nm in ("Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _frag_fix(_nm, "Marine crew may be", _CSM_TH, into_t="ORDNANCE")
_frag_fix("The Emperor's Inquisition", "Space Marine Chapters are fiercely",
          "Space Marine Chapters are fiercely independent and will only grudgingly submit to having their "
          "leadership usurped by an Inquisitor Lord, regardless of his renown.", into_t="RESERVES AND ALLIES")
_frag_fix("Rogue Traders", "The Rogue Trader cruiser profile",
          "The Rogue Trader cruiser profile represents a Kar Durniash pattern Imperial Navy cruiser, a basic "
          "profile on which a Rogue Trader may customize as desired using the Xenotech rules.",
          new_t="ROGUE TRADER “CRUISERS”")
print("J213: osion otsikoksi poimittuja lauseita korjattu 5")

# --- J213: tarkistuksia Check yourself -luokittelusta (docs/check-yourself) --
# Jokainen saanto on kirjan lause sellaisenaan (src), jotta lause siirtyy
# osiossaan "Checked by the builder" -ryhmaan. Lause haetaan datasta eika
# kirjoiteta kasin: kaarevat heittomerkit pysyvat tavulleen samoina.
def _j213_text(L, si, has):
    _h = [t for t in L["secs"][si].get("text") or [] if has in t]
    assert len(_h) == 1, "J213 %s / %s: %r osui %d lauseeseen" % (L["nm"], L["secs"][si]["t"], has, len(_h))
    return _h[0]
_j213 = 0
# (a) s.453 (S1094): Kor'O'Mesme on aina oman Custodianinsa kyydissa.
_MS = _p18_list("Tau — Commerce Protection")
_ms_fr = [i for i, s in enumerate(_MS["secs"]) if s["t"].startswith("FLEET RULES")][0]
_MS["secs"][_ms_fr].setdefault("rules", []).append(dict(
    kind="requires", ok=True, label="Kor'O'Mesme needs his own battleship",
    if_pick=[dict(sec=_p18_sec(_MS, "Commander"), re="mesme")],
    then_pick=[dict(sec=_p18_sec(_MS, "Battleships"), re="^custodian")], min=1,
    src=_j213_text(_MS, _ms_fr, "is embarked aboard the Kor")))
_j213 += 1
# (b) s.177 (S0380, S0384, S0386): Exploration-listan liittolaiset yhdelta
# listalta; ei Demiurgia eika Krootia, jos Space Marines -aluksia on mukana.
_EXR = _p18_sec(_EX, "RESERVES AND ALLIES")
_EX["secs"][_EXR].setdefault("rules", []).append(dict(
    kind="one_donor", ok=True, roles=["ally"], label="Allies from one fleet list",
    src=_j213_text(_EX, _EXR, "they can only be from one fleet")))
for _t, _has, _lab in (("The Demiurg", "Demiurg vessels may not be employed if Space Marines",
                        "No Demiurg with Space Marines"),
                       ("The Kroot", "A Kroot Warsphere may not be employed if Space Marines",
                        "No Kroot with Space Marines")):
    _si = _p18_sec(_EX, _t)
    _EX["secs"][_si].setdefault("rules", []).append(dict(
        kind="conditional_cap", ok=True, label=_lab, pick=[dict(sec=_si)],
        cond_pick=[dict(race="space marines")], cond_min=1, max_unmet=None, max_met=0,
        src=_j213_text(_EX, _si, _has)))
    _j213 += 1
# (c) Sopimussaannot (S0352 s.174, S1004 s.426): rivi on laillinen vain
# vastustajan suostumuksella - tarkistus nayttaa sen keltaisena, kun rivi on
# otettu.
for _nm in ("Rogue Traders", "Rogue Traders — Exploration",
            "Rogue Traders — Pirates and Wolf Packs"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "NOTES FROM NATE MONTES")
    _L["secs"][_si].setdefault("rules", []).append(dict(
        kind="agreement", ok=True, label="Siluria and Havoc (outdated ships)", pick=[dict(sec=_si)],
        src=_j213_text(_L, _si, "If both players agree before the game")))
    _j213 += 1
for _nm in ("Tyranids — Hive Fleet", "Tyranids — Vanguard Fleet"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "BIO-ENHANCEMENTS")
    _L["secs"][_si].setdefault("rules", []).append(dict(
        kind="agreement", ok=True, label="Bio-enhancements in a one-off game", up_sec=_si,
        src=_j213_text(_L, _si, "These refits can only be used in one-off games")))
    _j213 += 1
# (d) Adeptus Mechanicus -reservit (s.121-122, S0246 S0249 S0250 S0255 S0256).
# Space Marine -reservit ilman inkvisiittoria, kun laivastossa ei ole
# tavallisia Imperial Navy -capital shipeja eika muukalaisaluksia; niille oma
# suhde (strike cruiser / 3 Mechanicus-capital shipia, battle barge / 3 strike
# cruiseria) yleisen tyyppikohtaisen 1:3:n sijaan. Reservi-capital shipeja
# enintaan yksi kolmea omaa capital shipia kohden. Reservisaattajat ilman
# 1:3-rajaa, kun ne ovat samalta listalta kuin reservi-capital ship (T51).
_AMX = _p18_list("Adeptus Mechanicus — Explorator")
_amf = [i for i, s in enumerate(_AMX["secs"]) if s["t"].startswith("FLEET RULES")][0]
_AM_SM_SRC = _j213_text(_AMX, _amf, "Space Marines can also be used as reserves in a Mechanicus fleet")
_AMX.setdefault("res_ok", []).append(dict(
    race="space marines", unless_fl="IMPERIAL NAVY", unless_xenos=True,
    needs_what="no regular Imperial Navy capital ships and no alien vessels in the fleet (or an Inquisitor Lord)",
    src=_AM_SM_SRC + " (Fleets p. 121)"))
_AMX["res_mech"] = dict(
    cap_src=_j213_text(_AMX, _amf, "No more than one reserve vessel can be taken for every three capital ships") + " (Fleets p. 121)",
    sm_src=_j213_text(_AMX, _amf, "They can be taken in the ratio of one strike cruiser") + " (Fleets p. 121)",
    esc_src=_j213_text(_AMX, _amf, "There are no restrictions on how many reserve Imperial Navy") + " "
            + _j213_text(_AMX, _amf, "Escorts taken in this manner must be taken from the same fleet list") + " (Fleets p. 122)",
    interp=dict(id="T51", note="Open interpretation: \"Escorts taken in this manner must be taken from the same fleet "
                "list reserve capital ships are being drawn from\" (Fleets p. 122). The app reads it as: reserve escorts "
                "are free of the 1:3 limit when a reserve capital ship comes from the same list; other reserve escorts "
                "count against the normal 1:3."))
_j213 += 1
assert _j213 == 9, "J213: lisayksia %d" % _j213
print("J213: tarkistuksia lisatty %d" % _j213)

# J214 (check yourself -vaihe 3): laivaston tiedot, jotka builder laskee
# laivastosta: attack rating, vastustajan ilmaiset lisat ja Demiurgien
# VP-arvot. Ne eivat ole tarkistuksia vaan pelaajalle laskettua tietoa
# (domain.js fleetFacts). Data ei viittaa osioindekseihin.
#
# ar = saannot jarjestyksessa: {v, cite:[{s, pg, rb}], when}. when-ehdot
# luetaan laivaston yksikoista: all = jokaiselle regexille on rivi, none =
# millekaan ei ole, from = jokin alus tulee tasta alkuperasta (lainalistan
# rotu tai nimi, tai oman listan access-osion otsikko). Ehdoton saanto on
# perusluku; ehdolliset ohittavat sen. Kaksi eri lukua antavaa ehdollista
# saantoa = kirjan ristiriita, joka naytetaan eika valita (T53).
def _cite(s, pg, rb=False):
    return dict(s=s, pg=pg, rb=1) if rb else dict(s=s, pg=pg)
def _ar(v, *cites, **when):
    r = dict(v=v, cite=list(cites))
    if when: r["when"] = when
    return r
_AR_IN = _cite("The Imperial Navy have a starting attack or initiative rating of 2.", 32)
_AR_MECH = _cite("The Adeptus Mechanicus have a starting attack or initiative rating of 2.", 118)
_AR_SM = _cite("Space Marines have a starting attack or initiative rating of 3.", 94)
_AR_IL_IN = _cite("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor Lord has an attack rating of 2.", 139)
_AR_IL_SM = _cite("A Space Marine fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is "
                  "accompanying the fleet, in which case its attack rating is 2.", 139)
_AR_IL_GK = _cite("A Grey Knights fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is "
                  "accompanying the fleet, in which case its attack rating is 2.", 145)
_AR_GK = _cite("Grey Knights count as Space Marines in all respects and as such follow all rules for Space Marines "
               "as written on pages 92-94.", 144)
_AR_CW = _cite("An Eldar fleet containing any Craftworld Eldar vessels has an attack (or initiative) rating of 3.", 302)
_AR_CORS = _cite("An Eldar Corsair fleet containing no Craftworld Eldar vessels has an attack (or initiative) rating of 4.", 302)
_AR_YRIEL = _cite("A fleet led by him has an attack rating of 4, even if it includes Craftworld vessels.", 319)
# Rulebook s.120: taulukko "ATTACK RATINGS". Kayteaan vain, kun Fleets-kirjan
# listalla ei ole omaa lukua (Orks, Dark Eldar).
_AR_RB = lambda nm, v: _cite("The chart that follows shows the attack ratings of all fleets. %s: %d" % (nm, v), 120, rb=True)
_LORD, _BSHIP, _YR = "inquisitor lord", "^inquisition blackship", "^prince yriel"
_CWF = ["^craftworld eldar$"]
def _lord_sm(c):
    return [_ar(3, c, all=[_LORD], none=[_BSHIP]), _ar(2, c, all=[_LORD, _BSHIP])]
_AR = {
    "Imperial Navy": [_ar(2, _AR_IN), _ar(2, _AR_IL_IN, all=[_LORD])],
    "Adeptus Mechanicus — Explorator": [_ar(2, _AR_MECH), _ar(2, _AR_IL_IN, all=[_LORD])],
    "Space Marines — Codex Astartes": [_ar(3, _AR_SM)] + _lord_sm(_AR_IL_SM),
    "Space Marines — Crusade": [
        _ar(3, _cite("A Space Marine Crusade Fleet has an attack rating of 3.", 99)),
        _ar(1, _cite("If the fleet includes a fortress- monastery, it has an attack rating of 1; even Space Marines "
                     "find it difficult to launch a surprise blitz with a billion tons of fortress monastery in tow!", 99),
            all=["^fortress-monastery"])] + _lord_sm(_AR_IL_SM),
    "Space Marines — Dominion": [
        _ar(3, _cite("A Space Marine Dominion Fleet has an attack rating of 3.", 101)),
        _ar(2, _cite("This is reduced to 2 if the fleet has any Imperial Navy, Mechanicus or Rogue Trader vessels "
                     "at all.", 101), frm=["^imperial navy$", "^rogue traders", "^adeptus mechanicus"])] + _lord_sm(_AR_IL_SM),
    "Grey Knights": [_ar(3, _AR_GK, _AR_SM)] + _lord_sm(_AR_IL_GK),
    "Rogue Traders — Exploration": [_ar(3, _cite("When used with this fleet list, Rogue Traders have an attack "
                                                 "(initiative) rating of 3.", 176))],
    "Rogue Traders — Pirates and Wolf Packs": [_ar(3, _cite("Pirate fleets have an attack or initiative rating of 3.", 178))],
    "Chaos": [_ar(2, _cite("Chaos fleets have a starting attack or initiative rating of 2.", 222))],
    "Eldar Corsairs": [_ar(4, _AR_CORS), _ar(3, _AR_CW, frm=_CWF, none=[_YR]), _ar(4, _AR_YRIEL, all=[_YR])],
    "Eldar — Iyanden Craftworld": [_ar(3, _AR_CW), _ar(4, _AR_YRIEL, all=[_YR])],
    "Dark Eldar": [_ar(4, _AR_RB("Dark Eldar", 4))],
    "Orks": [_ar(3, _AR_RB("Orks", 3))],
    "Necrons": [_ar(4, _cite("Necrons have a starting attack or initiative rating of 4.", 400))],
    "Tyranids": [_ar(3, _cite("Tyranids have a starting attack or initiative rating of 3.", 416))],
    "Tau": [_ar(2, _cite("Tau have a starting attack or initiative rating of 2.", 450))],
    "Demiurg — War Host": [_ar(2, _cite("The Demiurg fleet has an Attack or Initiative rating of 2.", 486))],
}
# Listat, joilla ei ole lukua: naytetaan "not given" ja mista luku voisi tulla
# (T53). Inquisition ei ole itsenainen laivasto (s.132), Rogue Traders
# -listalla (s.168-175) ei ole omaa lukua.
_AR_NONE = {
    "The Emperor's Inquisition": [_AR_IL_IN, _AR_IL_SM],
    "Rogue Traders": [_cite("When used with this fleet list, Rogue Traders have an attack (initiative) rating of 3.", 176),
                      _cite("The chart that follows shows the attack ratings of all fleets. Imperial: 2", 120, rb=True)],
}
# Lauseet, joita ei ole osioiden tekstissa (rodun yleissaannot jaivat
# poiminnasta): ne todistaa golden-tapausten why + check_quotes.py.
_AR_OFFTEXT = {"Chaos fleets have a starting", "An Eldar fleet containing any", "An Eldar Corsair fleet containing no",
               "Tyranids have a starting"}
_all_text = " ".join(_text_key(t) for _L in lists_out for _s in _L["secs"] for t in (_s.get("text") or []))
_j214 = 0
for _L in lists_out:
    _keys = ([k for k in list(_AR) + list(_AR_NONE) if _L["nm"] == k]
             or [k for k in list(_AR) + list(_AR_NONE) if _L["nm"].startswith(k + " —")])
    assert len(_keys) == 1, "J214: attack rating listalle %s: %s" % (_L["nm"], _keys)
    if _keys[0] in _AR_NONE:
        _L["ar"] = dict(rules=[], none=_AR_NONE[_keys[0]])
    else:
        _L["ar"] = dict(rules=_AR[_keys[0]])
    for _r in _L["ar"]["rules"]:
        for _c in _r["cite"] + _L["ar"].get("none", []):
            if _c.get("rb") or any(_c["s"].startswith(x) for x in _AR_OFFTEXT):
                continue
            assert _text_key(_c["s"]) in _all_text, "J214: lause ei ole kirjan tekstissa: %s" % _c["s"]
    _j214 += 1
assert _j214 == len(lists_out) == 32, _j214

# Vastustajan ilmaiset lisat. opp = [{pick:[regex], what, many, cite}]:
# maara = valittujen rivien runkojen summa (komentaja = 1).
_OPP_MAL = dict(pick=["^ordo malleus inquisitor lord$"], what="Mark of Chaos or Daemonship",
                many="Marks of Chaos or Daemonships",
                cite=[_cite("The enemy Chaos fleet may add one Mark of Chaos or upgrade a cruiser to a Daemonship at "
                            "no cost.", 142)])
_OPP_XEN = dict(pick=["^ordo xenos inquisitor lord$"], fixed="D6×50 pts of escorts",
                cite=[_cite("The enemy Xenos fleet adds D6×50 points of escort vessels to its fleet for free.", 141)])
_OPP_GK = dict(pick=["^ordo malleus inquisitor lord", "^grey knights strike cruiser"],
               what="Mark of Chaos or Daemonship", many="Marks of Chaos or Daemonships",
               cite=[_cite("An enemy Chaos fleet may add one Mark of Chaos; or upgrade a cruiser to a Daemonship; for "
                           "no aditional cost, for each of the following included in the Grey Knights Fleet: "
                           "Ordo Malleus Inquisitor Lord, Grey Knights Strike Cruiser", 145)])
_nopp = 0
for _L in lists_out:
    _labs = set(e["l"].lower() for _s in _L["secs"] for e in (_s.get("ents") or []))
    _o = []
    if _L["nm"] == "Grey Knights":
        _o.append(_OPP_GK)
    elif "ordo malleus inquisitor lord" in _labs:
        _o.append(_OPP_MAL)
    if "ordo xenos inquisitor lord" in _labs:
        _o.append(_OPP_XEN)
    if _o:
        _L["opp"] = _o
        _nopp += 1
# Ordo Malleus: 4 IN-listaa, AdMech ja Inquisition; Grey Knights; Ordo Xenos vain Inquisitionissa
assert _nopp == 7, "J214: vastustajan etuja %d listalla" % _nopp

# Demiurgien VP-arvo (s.486, Determination): "Demiurg vessels used with this
# fleet list" - vain War Host -listalla ja vain Demiurg-aluksille.
_VPL = _p18_list("Demiurg — War Host")
_VPL["vp"] = dict(fl="^DEMIURG$", rows=[dict(re="^stronghold", nm="Stronghold", v=400),
                                        dict(re="^bastion", nm="Bastion", v=300),
                                        dict(re="^citadel", nm="Citadel", v=200)],
                  cite=[_cite("Though their point cost remains unchanged, Strongholds are worth 400 points, Bastions "
                              "are worth 300 points and Citadels are worth 200 points when determining Victory Points.", 486)])
assert _text_key(_VPL["vp"]["cite"][0]["s"]) in _all_text
print("J214: attack rating %d listalla, vastustajan etuja %d listalla, VP-arvot 1 listalla" % (_j214, _nopp))

# J215 (check yourself -vaihe 4): kenen aluksella komentaja on. L.place =
# saannot komentajariveille (cmd = rivin regex), domain.js placeCommanders.
#   prefer   [{re, cite}] jarjestyksessa: ensimmainen, jota laivastossa on,
#            rajaa valinnan niihin (MoF -> battle barge, Inquisitor ->
#            Inquisitorial Cruiser -> Blackship)
#   dearest  {cite, n}: muuten kallein alus; n = yhta monta kalleinta kuin
#            saman saannon komentajia (Pirate Captains s. 178)
#   only     {any:[{re, arm}], capital, mech, cite}: vain tallaiset alukset
#   no_up    [{re, cite}]: ei alukselle, jolla on tama paivitys (Daemonship)
#   not_with [{cmd, cite}]: ei samalle alukselle kuin tama komentaja
#   alone    {cite}: saman saannon komentajat eri aluksilla
#   skip     ei henkiloa aluksella (Ordo-sidonta on Inquisitor Lordin lisa)
# Saannoton komentaja (Admiral ym.) valitaan vapaasti, oletuksena kallein.
_pl = lambda s, pg: _cite(s, pg)
_PL_INQ = dict(cmd="^inquisitor lord", prefer=[
    dict(re="^inquisitorial cruiser", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 138)),
    dict(re="^inquisition blackship", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 138))])
_PL_ORDO = dict(cmd=r"^ordo \w+ inquisitor lord$", skip=True)
_PL_MOF = lambda re, s, pg: dict(cmd="^master of the fleet", prefer=[dict(re=re, cite=_pl(s, pg))])
_CH_WM = _cite("Under no circumstance can a Chaos Lord be placed on the same ship as a Warmaster.", 222)
_CH_AB = _cite("You may not place a Chaos Lord on the same ship as Abaddon.", 231)
def _chaos(wm_s, wm_pg, lord_s, lord_pg, dae_s, dae_pg):
    dae = [dict(re="^daemonship", cite=_cite(dae_s, dae_pg))]
    return [dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(wm_s, wm_pg)), no_up=dae),
            dict(cmd="^abaddon", prefer=[dict(re="^planet killer",
                 cite=_cite("If Abaddon is present, he must be aboard the Planet Killer.", 235))]),
            dict(cmd="^chaos lord", only=dict(capital=True, cite=_cite(lord_s, lord_pg)), no_up=dae,
                 not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM), dict(cmd="^abaddon", cite=_CH_AB)],
                 alone=dict(cite=_cite(lord_s, lord_pg)))]
_LORD_BC = "Any capital ship, apart from that of the Warmaster, may be captained by a Chaos Lord."
_LORD_G = "Any capital ship apart from that of the Warmaster may be captained by a Chaos Lord."
_WM_G = "He must be assigned to the most expensive ship and improves its rolled Leadership by +2, to a maximum of 10."
_DAE_G = "A Daemonship may not be commanded by a Warmaster or a Chaos Lord, even if it is the largest ship in the fleet."
_YRIEL = dict(cmd="^prince yriel",
              prefer=[dict(re="^flame of asuryan", cite=_cite("He must be embarked aboard the Flame of Asuryan if it "
                                                              "is present, in which case his cost is 125 points.", 319))],
              only=dict(any=[dict(re="^flame of asuryan"), dict(re="^dragonship", arm="launch bay")],
                        cite=_cite("When Yriel is taken he must be placed on a Craftworld Eldar Dragonship with launch "
                                   "bays, but you may instead pick the Flame of Asuryan as his command ship to be "
                                   "embarked on.", 319)))
_PLACE = {
    "Imperial Navy": [_PL_INQ, _PL_ORDO],
    "Space Marines — Codex Astartes": [
        _PL_MOF("battle barge", "If your fleet includes any battle barges, he must be assigned to a battle barge in "
                "preference to a strike cruiser.", 97), _PL_INQ],
    "Space Marines — Crusade": [
        _PL_MOF("battle barge", "If your fleet includes any battle barges, he must be assigned to a battle barge.", 98),
        _PL_INQ],
    "Space Marines — Dominion": [
        _PL_MOF("^venerable battle barge", "If a Venerable battle barge is included in the fleet, the Master of the "
                "Fleet must be assigned to it.", 100), _PL_INQ],
    "Adeptus Mechanicus — Explorator": [
        dict(cmd="^archmagos veneratus",
             prefer=[dict(re="ark mechanicus", cite=_cite("An Archmagos Veneratus must be embarked on an Ark "
                                                          "Mechanicus if one is included in the fleet.", 124))],
             only=dict(mech=True, cite=_cite("An Adeptus Mechanicus fleet commander can only be embarked on a "
                                             "Mechanicus ship.", 121))),
        dict(cmd="^archmagos", only=dict(mech=True, cite=_cite("An Adeptus Mechanicus fleet commander can only be "
                                                               "embarked on a Mechanicus ship.", 121))),
        _PL_INQ, _PL_ORDO],
    "The Emperor's Inquisition": [_PL_INQ, _PL_ORDO],
    "Grey Knights": [dict(cmd="inquisitor lord", prefer=[
        dict(re="^inquisitorial cruiser", cite=_cite("If an Inquisitorial Cruiser is present the Inquisitor Lord "
                                                     "must be placed aboard it.", 144)),
        dict(re="^inquisition blackship", cite=_cite("If the Inquisitorial Cruiser is not present but a Blackship "
                                                     "is then the Inquisitor Lord must be placed aboard the "
                                                     "Blackship.", 144))],
        dearest=dict(cite=_cite("Otherwise the Inquisitor must be placed on the most expensive ship.", 144)))],
    "Rogue Traders": [
        dict(cmd="^veteran rogue trader", only=dict(any=[dict(re="^rogue trader cruiser")],
             cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 174)),
             alone=dict(cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 174)))],
    "Rogue Traders — Pirates and Wolf Packs": [
        dict(cmd="^pirate captain", dearest=dict(n=True, cite=_cite(
            "He (or she!) must be placed aboard the most expensive vessel in the fleet (or vessels if more than one "
            "Captain is present).", 178)),
             alone=dict(cite=_cite("He (or she!) must be placed aboard the most expensive vessel in the fleet (or "
                                   "vessels if more than one Captain is present).", 178)))],
    "Chaos — Incursion": [
        dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(
            "He must be assigned to the biggest (ie, most expensive) ship and improves its Leadership to the value "
            "shown below.", 232))),
        dict(cmd="^chaos lord", not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM)])],
    "Chaos — Black Crusade": _chaos("He must be assigned to the most expensive ship and improves its rolled "
                                    "Leadership by +2, to a maximum of 9.", 234, _LORD_BC, 234,
                                    "A Daemon ship may not be commanded by a Warmaster or a Chaos Lord even if it is "
                                    "the largest ship in the fleet.", 235),
    "Chaos — Tzeentch": _chaos(_WM_G, 236, _LORD_G, 236, _DAE_G, 237),
    "Chaos — Nurgle": _chaos(_WM_G, 240, _LORD_G, 240, _DAE_G, 241),
    "Chaos — Khorne": _chaos(_WM_G, 244, _LORD_G, 244, _DAE_G, 245),
    "Chaos — Slaanesh": _chaos(_WM_G, 248, _LORD_G, 248, _DAE_G, 249),
    "Eldar Corsairs": [
        dict(cmd="^eldar hero", prefer=[dict(re="^flame of asuryan", cite=_cite(
            "If the Flame of Asuryan is taken, the Eldar Hero must be embarked aboard it.", 316))]), _YRIEL],
    "Eldar — Iyanden Craftworld": [_YRIEL],
    "Tau — Commerce Protection": [
        dict(cmd="^kor.o.mesme", prefer=[dict(re="^custodian", cite=_cite(
            "Kor’O’Mesme is embarked aboard the Kor’or’vesh vessel Bor’kan Or’es El’Leath Se’arle O’Mesme "
            "(Custodian Class Battleship).", 453))])],
}
# s.222 ja s.231 (lyhyt muoto) eivat ole osioiden tekstissa; golden-why + check_quotes todistaa ne.
_PL_OFFTEXT = {"Under no circumstance can a Chaos Lord", "You may not place a Chaos Lord on the same ship as Abaddon."}
_j215 = 0
for _L in lists_out:
    _keys = ([k for k in _PLACE if _L["nm"] == k] or [k for k in _PLACE if _L["nm"].startswith(k + " —")])
    if not _keys:
        continue
    assert len(_keys) == 1, (_L["nm"], _keys)
    _L["place"] = _PLACE[_keys[0]]
    _labs = [e["l"] for _s in _L["secs"] for e in (_s.get("ents") or []) if e.get("k") == "cmd"]
    for _r in _L["place"]:
        # jokainen saanto osuu ainakin yhteen listan komentajariviin
        assert any(re.search(_r["cmd"], l, re.I) for l in _labs), "J215: %s: %s ei osu" % (_L["nm"], _r["cmd"])
        _cs = [p["cite"] for p in _r.get("prefer", [])] + [x["cite"] for x in _r.get("no_up", []) + _r.get("not_with", [])]
        _cs += [_r[k]["cite"] for k in ("dearest", "only", "alone") if k in _r]
        for _c in _cs:
            if any(_c["s"].startswith(x) for x in _PL_OFFTEXT):
                continue
            assert _text_key(_c["s"]) in _all_text, "J215: lause ei ole kirjan tekstissa: %s" % _c["s"]
    _j215 += 1
assert _j215 == 23, "J215: sijoitussaantoja %d listalla" % _j215
print("J215: komentajan sijoitussaannot %d listalla" % _j215)

# J216 (check yourself -vaihe 5): laivueet ja Clanzin Warlordit.
# Yksikon sq = laivuetunniste (sama tunniste = sama laivue, s.13), Clanzissa
# cmd = Warlordin uid. Yleinen s.13-saanto on domain.js:ssa (SQ_*); tassa
# listojen poikkeukset osion NIMELLA (ei indeksilla):
#   sqx      [{sec, min, max, only, cite}]: tasta osiosta koottu laivue
#   sq_noup  [{re, cite}]: alus, jolla on tama paivitys, ei laivueeseen
#   sq_need  [{cmd, cite}]: taman komentajan alus on laivueessa
_CZL = _p18_list("Orks — Da Ork Clanz")
_CZ_CITE = lambda s, pg: _cite(s, pg)
_CZL["clanz"] = dict(
    warlord="^ork warlord",
    tiddla="^tiddla skwadron$", big="^big ship skwadron$", uge="uge ship skwadron$", hulk="^space hulks$", rok="^roks$",
    # gub_re: Gubbins-kiintioon (s.372) eivat kuulu More Gubbins (s.371 "any number of capital ships") eika
    # Deathskullzin ilmainen looted-kopio (J7, s.369: klaanin etu jokaiselle Deathskullz-skwadronille, J232)
    clan_sec="^clan upgrades$", gub_sec="^gubbins$",
    gub_re=r"^(?!Klaws|Shokk-Attack Lance|Assault Karrier|.*\(Deathskullz: free\))",
    sk=_cite("For every re-roll a Warlord has (including the first one for free), the Warlord must be in command of "
             "one tiddla skwadron of at least three escorts and one other skwadrons.", 372),
    sk_interp="Open interpretation T52: read as exactly one tiddla and one other skwadron per re-roll, as the "
              "book's smallest and largest fleets show (Fleets p. 373).",
    uge1=_cite("There is no restriction for what kinds or how many of what type of skwadrons are in the fleet as long "
               "as no Warlord may have more than one ’Uge Ship, which counts as a skwadron by itself.", 373),
    uge2=_cite("A Warlord must have two kroozers in order to take a “Uge ship, meaning the Warlord must have at least "
               "one extra re-roll to do so.", 373),
    hulk1=_cite("A Warlord leading a Space Hulk may only lead it and no other ships, but he is not required to take any "
                "extra re-rolls to do so if it is not desired.", 373),
    hulk2=_cite("One of your Warlords must be embarked on it, which by itself counts as all the skwadrons that Warlord "
                "can have (including a tiddla skwadron), regardless of how many re-rolls the Warlord has.", 372),
    clan=_cite("A Warlord and his skwadrons may only be from one clan, but as many different clans as desired can be "
               "in a single fleet.", 369),
    clan_sq=_cite("If taken, every capital ship in the skwadron must separately take and pay for the clan upgrade, not "
                  "just individual ships.", 369),
    gub=_cite("A Warlord may choose for his own ship or escort skwadron one upgrade from the Gubbins list for every "
              "re-roll he has at its listed cost.", 372),
    # J232: skwadron on yhden Warlordin, eika sita jaeta (s.373)
    split=_cite("Each skwadron must be fielded with the number of ships chosen for it in this list; you can\u2019t "
                "split up skwadrons or add more ships to them.", 373))
_CZL["sqx"] = [dict(sec="^big ship skwadron$", min=1, max=2, only=True, name="kroozers",
                    cite=_cite("1-2 Kroozers, chosen from the following list:", 372)),
                # J232 (kayttaja 24.10.2026: "toimiiko rok sqadron kuten kapital ship?", "korjaa"):
                # Rok skwadron on 1-4 Rokia kuten Big ship skwadron 1-2 kroozeria. Kirja painaa
                # koon osion otsikkona (s.372 "Rok skwadron / 1-4 Roks"), joten lause on otsikko.
                dict(sec="^roks$", min=1, max=4, only=True, name="Roks", cite=_cite("1\u20134 Roks", 372))]
# Warlord kalleimmalle alukselle OMASSA komennossaan (s.372), ei koko laivaston.
_CZL["place"] = [dict(cmd="^ork warlord", dearest=dict(own=True, cite=_cite(
    "He must be embarked on the most expensive ship under his own command (as opposed to the whole fleet), even if it "
    "is an escort - annotate which one it is.", 372)))]
_WAL = _p18_list("Orks — Waaagh!")
_WAL["sqx"] = [dict(sec="^ork roks$", min=2, max=4, only=True, name="Roks", cite=_cite(
    "Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other "
    "vessels.", 367))]
_nsq = 0
for _L in lists_out:
    if _L["nm"] in ("Chaos — Black Crusade", "Chaos — Tzeentch", "Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
        _L["sq_noup"] = [dict(re="^daemonship", cite=_cite("Daemonships cannot be used in squadrons.", 227))]
        _nsq += 1
assert _nsq == 5, _nsq
_p18_list("Imperial Navy — Bastion Fleets")["sq_need"] = [dict(cmd="^veteran captain", cite=_cite(
    "Ships assigned a Veteran Captain must be squadroned on the tabletop (their skills are too precious to waste on "
    "lone ships).", 38))]
for _L in (_CZL, _WAL):
    for _x in _L["sqx"]:
        assert sum(1 for _s in _L["secs"] if re.search(_x["sec"], _s["t"].strip(), re.I)) == 1, (_L["nm"], _x["sec"])
for _k in ("tiddla", "big", "uge", "hulk", "rok", "clan_sec", "gub_sec"):
    assert sum(1 for _s in _CZL["secs"] if re.search(_CZL["clanz"][_k], _s["t"].strip(), re.I)) == 1, _k
# J232: osion otsikko ("1-4 Roks", s.372) on kirjan tekstia, vaikka poiminta ei vie sita osion tekstiin
_RAW_HEADS = set(_text_key(_s.get("head") or "") for _Lx in json.load(io.open("lists_raw.json", encoding="utf-8"))
                 for _s in _Lx.get("sections") or [])
for _L in lists_out:
    for _x in (_L.get("sqx") or []) + (_L.get("sq_noup") or []) + (_L.get("sq_need") or []):
        assert _text_key(_x["cite"]["s"]) in _all_text or _text_key(_x["cite"]["s"]) in _RAW_HEADS, \
            "J216: lause ei ole kirjan tekstissa: %s" % _x["cite"]["s"]
for _k, _c in _CZL["clanz"].items():
    if isinstance(_c, dict):
        assert _text_key(_c["s"]) in _all_text, "J216: lause ei ole kirjan tekstissa: %s" % _c["s"]
print("J216: laivuepoikkeukset 2 listalla (Clanzissa kroozerit ja Rokit, J232), Daemonship-kielto %d listalla, Clanzin komento" % _nsq)

# J224: Waaagh!-listan hulkin Warlord maksaa Extra Power Fieldsista +50
# (s.390). Rivi "Extra Power Fields (Space Hulk)" tulee upgrades.py:sta;
# resolveFleet vertaa Warlordin ottamaa rivia alukseen, jolla han on (J215):
# hulkilla +25-rivi on punainen, muualla +50-rivi. Sijoitus ei muuta hintaa
# (J8), se on tarkistus.
_WAL["hulk_pf"] = dict(
    cmd="^ork warlord$", sec="^warlord$", row="^Extra Power Fields$",
    hulk_row=r"^Extra Power Fields \(Space Hulk\)$", ship="^ork hulk$",
    cite=_cite("Extra Powerfields costs +50 pts instead of +25.", 390))
assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)) == 1
for _k in ("row", "hulk_row"):
    assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)
               for _e in _s["ents"] if re.search(_WAL["hulk_pf"][_k], str(_e["l"]))) == 1, _k
# Lause on Ork hulkin profiilin jatkosivulta (s.390, WARLORDS-kohta), ei
# listasivulta, joten _all_text ei sisalla sita; luettu kasin PDF:sta 20.10.2026
# (sama saanto domain.js:n hulkin erikoissaannoissa).
print("J224: Waaagh!-hulkin Warlordin Extra Power Fields +50")

# J217 (check yourself -vaihe 6A): reitit.
# s.49: "In a Bakka fleet list, cruisers from the Adeptus Mechanicus fleet list
# may be taken instead of and in the same manner as Imperial Navy
# battlecruisers, counting as battlecruisers against any fleet limits in all
# respects." AdMech-listan Cruisers-rivit Bakkan Battlecruisers-osioon omina
# riveinaan AdMechin hinnalla; mech=1 tekee niista Mechanicus-aluksia (lahjat,
# korjaus, s.49 "They utilize all rules for Adeptus Mechanicus vessels").
# Archmagosta Bakka-listalla ei ole, joten s.49:n kielto tayttyy rakenteesta.
import copy as _copy
def _shift_section_refs(Lz, at):
    """Osion lisays kohtaan `at`: jokainen viittaus >= at kasvaa yhdella.
    Avaimet ovat samat kuin count_section_refs/_sec_names_walk kayttavat."""
    def walk(node):
        if isinstance(node, list):
            for x in node:
                walk(x)
            return
        if not isinstance(node, dict):
            return
        for k, v in list(node.items()):
            if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(isinstance(i, int) for i in v):
                node[k] = [i + 1 if i >= at else i for i in v]
            elif k in ("sec", "up_sec") and isinstance(v, int):
                if v >= at:
                    node[k] = v + 1
            elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
                walk(v)
    for s in Lz["secs"]:
        walk(s.get("rules") or [])
_BK, _AM = _p18_list("Imperial Navy — Bakka Sector"), _p18_list("Adeptus Mechanicus — Explorator")
_bkbc = _BK["secs"][_p18_sec(_BK, "Battlecruisers")]
_amcr = _AM["secs"][_p18_sec(_AM, "Cruisers")]
assert len(_amcr["ents"]) == 7, [e["l"] for e in _amcr["ents"]]
for _e in _amcr["ents"]:
    _n = _copy.deepcopy(_e)
    _n["l"] = _e["l"] + " (Adeptus Mechanicus)"
    _n["mech"] = 1
    _n["src_page"] = 49
    _n["nt"] = "Adeptus Mechanicus cruiser taken as a battlecruiser (Fleets p. 49)."
    _bkbc["ents"].append(_n)
# s.483: Demiurg Bastion palkkasoturina. Osio PLANETARY DEFENCESin edelle
# (PD on aina viimeinen, test_domain), ja taman listan osioviittaukset
# siirretaan samalla avainjoukolla, jota osiovartija tarkistaa
# (_SEC_LIST_KEYS, sec, up_sec). Ei Orkeille, Tyranideille eika Necroneille; ei
# listoille, joilla Bastion jo on (RT, Exploration, Tau, War Host); eika
# Crusadelle ja Grey Knightsille, jotka eivat ota muiden listojen aluksia
# (s.99, s.146) - avoin tulkinta T54.
_MERC_S1 = ("Any fleet except Orks, Tyranids and Necrons can use Demiurg Bastion class vessels; they are purchased "
            "as cruisers but do not contribute to the number of ships required to gain access to battleships, "
            "grand cruisers, etc.")
_MERC_S2 = ("Demiurg ships can never carry fleet commanders, use fleet commander re-rolls or be placed in squadrons "
            "with non-Demiurg vessels.")
assert _text_key(_MERC_S1) in _all_text and _text_key(_MERC_S2) in _all_text
_WH = _p18_list("Demiurg — War Host")
_bast = [e for s in _WH["secs"] for e in (s.get("ents") or []) if e["l"] == "Bastion Commerce Vessel"]
assert len(_bast) == 1
_nmerc = 0
for _L in lists_out:
    if re.match(r"^(Orks|Tyranids|Necrons|Demiurg)", _L["nm"]) or _L.get("res_ban"):
        continue
    if any(e["l"] == "Bastion Commerce Vessel" for s in _L["secs"] for e in (s.get("ents") or [])):
        continue
    _b = _copy.deepcopy(_bast[0])
    _b["src_page"] = 483
    _pd = [i for i, s in enumerate(_L["secs"]) if s.get("ct") == "defence"]
    assert _pd == [len(_L["secs"]) - 1], (_L["nm"], _pd)
    _shift_section_refs(_L, _pd[0])
    _L["secs"].insert(_pd[0], dict(t="DEMIURG MERCENARIES", text=[_MERC_S1, _MERC_S2], ents=[_b], rules=[], ct="access",
                                   noroute=1))
    _L["merc"] = dict(sec="^DEMIURG MERCENARIES$", cite=_cite(_MERC_S1, 483))
    _nmerc += 1
assert _nmerc == 19, "J217: palkkasoturiosioita %d" % _nmerc
# s.319: Void Stalker Iyanden-laivastossa ehdoin.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_VS_S = ("Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at "
         "least three Corsair Eldar cruisers and / or light cruisers are already present in the fleet.")
assert _text_key(_VS_S) in _all_text
_IY["borrow_cond"] = [dict(re="^void stalker", max=1, min_worth=1000, label="Void Stalker in an Iyanden fleet",
                           need=dict(n=3, list_re="^Eldar Corsairs", type_re="cruiser", what="Corsair cruisers"),
                           cite=_cite(_VS_S, 319))]
print("J217: Bakkan AdMech-risteilijoita 7, palkkasoturiosioita %d, Void Stalker -ehto" % _nmerc)

# J218 (check yourself -vaihe 6B): runkovalinnat ja RT-saattajat.
# s.174 ROGUE TRADER "CRUISERS": "Any cruiser hull allowed in the Rogue Trader,
# Exploration or Wolf Pack fleet list may be used and counts fully as a Rogue
# Trader cruiser." ja CAPITAL SHIPS: "If a second Rogue Trader cruiser is taken,
# it may be any Rogue Trader cruiser variant listed on the Exploration Fleet
# List." Rungot RT-listan CAPITAL SHIPS -osioon riveina "Rogue Trader cruiser -
# X class hull": Explorationin variantit sen hinnoin (s.176), Wolf Packin muut
# risteilijat sen hinnoin (s.178). Kevyet risteilijat eivat ole "cruiser
# hull": Exploration laskee ne erikseen ("Rogue Trader cruisers & Endeavours").
_RT0 = _p18_list("Rogue Traders")
_rtcap = _RT0["secs"][_p18_sec(_RT0, "CAPITAL SHIPS")]
_EXL, _WPL = _p18_list("Rogue Traders — Exploration"), _p18_list("Rogue Traders — Pirates and Wolf Packs")
_seen = set(["180"])
_rth = 0
for _src in (_EXL, _WPL):
    for _e in _src["secs"][_p18_sec(_src, "CAPITAL SHIPS")]["ents"]:
        _sh = ships.get(str(_e.get("r")))
        if _e.get("k") != "unit" or not _sh or str(_e["r"]) in _seen:
            continue
        if not re.match(r"^cruiser", str(_sh.get("ty", "")), re.I) or re.search(r"light cruiser", _e["l"], re.I):
            continue
        _seen.add(str(_e["r"]))
        _n = _copy.deepcopy(_e)
        _cls = re.sub(r"\s+cruiser$", "", _e["l"], flags=re.I) if re.search(r"class cruiser$", _e["l"], re.I) else _e["l"]
        _n["l"] = "Rogue Trader cruiser \u2014 " + _cls + " hull"
        _n["src_page"] = 174
        _n["nt"] = ("Counts fully as a Rogue Trader cruiser (Fleets p. 174); %s list price."
                    % ("Exploration" if _src is _EXL else "Wolf Pack"))
        _rtcap["ents"].append(_n)
        _rth += 1
assert _rth == 8, "J218: RT-runkoja %d" % _rth
_RT_S1 = "If a second Rogue Trader cruiser is taken, it may be any Rogue Trader cruiser variant listed on the Exploration Fleet List."
_RT_S2 = ("Any cruiser hull allowed in the Rogue Trader, Exploration or Wolf Pack fleet list may be used and counts "
          "fully as a Rogue Trader cruiser.")
assert _text_key(_RT_S1) in _all_text and _text_key(_RT_S2) in _all_text
_RT0["rt_hulls"] = dict(hull="^rogue trader cruiser \u2014 ", all="^rogue trader cruiser", cite=_cite(_RT_S1, 174),
                        cite2=_cite(_RT_S2, 174),
                        interp="Open interpretation T55: \"any cruiser hull ... counts fully as a Rogue Trader cruiser\" "
                               "allows every cruiser, but \"if a second Rogue Trader cruiser is taken\" reads as the "
                               "first being the Rogue Trader profile; the app warns and does not count it against the fleet.")
# s.138 Accompanying a fleet: "This may include the specific ship so-called in
# the Inquisition rules, but it can be any Imperial cruiser-class vessel."
# T56: luetaan sijoituksena (J215), ei runkovalintana. Inkvisiittorin
# risteilija on se Imperial-risteilija, jolla han on: ilman Inquisitorial
# Cruiseria ja Blackshipia Inquisitor Lordin paikka on vapaa (s.138), joten
# pelaaja nostaa hanet minka tahansa risteilijan kyytiin Aboard-valikosta.
# Runkovalinta (hc) kokeiltiin ja hylattiin: se vaihtaa kortin optiot
# runkovalintakortin malliin ja pudottaa Inquisitorial cruiserin omat optiot.
_ninq = 0
# s.139 RESERVES AND ALLIES (Inquisitorin johtama IN/AdMech): "If taken, a
# Rogue Trader escort squadron may accompany it, but Xenos vessels may not be
# used." ja s.50 Bakka: "One Rogue Trader cruiser and its attendant escorts may
# be taken for every 750 points in the fleet." RT-listan ei-Xenos-saattajat
# ROGUE TRADERS -osioon; Bakka ilman inkvisiittoria, muut sen kanssa.
_RTE = [e for e in _RT0["secs"][_p18_sec(_RT0, "ESCORTS")]["ents"] if not re.match(r"^xenos vessel", e["l"], re.I)]
assert [e["l"] for e in _RTE] == ["Recommissioned Escort", "Iconoclast Destroyer", "Armed Cargo Vessel"], [e["l"] for e in _RTE]
_INQ_S = "If taken, a Rogue Trader escort squadron may accompany it, but Xenos vessels may not be used."
_BK_S = "One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet."
assert _text_key(_INQ_S) in _all_text and _text_key(_BK_S) in _all_text
_nrte = 0
for _nm in ("Imperial Navy — Gothic Sector", "Imperial Navy — Bastion Fleets", "Imperial Navy — Armageddon Sector",
            "Imperial Navy — Bakka Sector", "Adeptus Mechanicus — Explorator", "The Emperor's Inquisition"):
    _L = _p18_list(_nm)
    _sec = _L["secs"][_p18_sec(_L, "ROGUE TRADERS")]
    for _e in _RTE:
        _n = _copy.deepcopy(_e)
        _n["src_page"] = 50 if "Bakka" in _nm else 139
        _sec["ents"].append(_n)
    # Osion omat saannot laskivat koko osion: "one Rogue Trader cruiser for
    # every 750 points" koskee risteilijaa, ei sen saattajia (regressio J218).
    _rp = 0
    for _r in _sec.get("rules") or []:
        for _pk in _r.get("pick") or []:
            if _pk.get("re") is None and _pk.get("sec") == _p18_sec(_L, "ROGUE TRADERS"):
                _pk["re"] = "^rogue trader cruiser"
                _rp += 1
    assert _rp >= 1, ("J218: RT-osion saantoa ei rajattu", _nm)
    _bk = "Bakka" in _nm
    _L["rt_esc"] = dict(sec="^ROGUE TRADERS$", esc="^(recommissioned escort|iconoclast destroyer|armed cargo vessel)$",
                        cru="^rogue trader cruiser", needs=None if _bk else "^inquisitor lord",
                        cite=_cite(_BK_S, 50) if _bk else _cite(_INQ_S, 139))
    _nrte += 1
print("J218: RT-runkoja %d, RT-saattajat %d listalla" % (_rth, _nrte))

# J219 (check yourself -vaihe 6C): Exploration s.177. Apualukset ovat
# lainattuja saattajia (ally/reserve), liittolais-capital shipit samalta
# listalta (one_donor, J213).
_EX = _p18_list("Rogue Traders — Exploration")
_AUX1 = "Besides Xenos vessels, auxiliary vessels from only one race can be taken in a fleet."
_AUX2 = "Any race can be used to provide auxiliary vessels except Orks, Dark Eldar, Necrons and Tyranids."
_AUX3 = "Xenos vessels cannot be employed if Space Marine escorts are used as auxiliary vessels."
_ABB = ("If the fleet is large enough that three reserve or allied capital ships are taken, a single (0-1) allied "
        "battleship may also accompany the fleet for its regular point cost without counting against cruiser limits.")
for _x in (_AUX1, _AUX2, _AUX3, _ABB):
    assert _text_key(_x) in _all_text, _x
_EX["aux"] = dict(never=["orks", "dark eldar", "necrons", "tyranids"], cite_one=_cite(_AUX1, 177),
                  cite_never=_cite(_AUX2, 177))
_EX["ally_bb"] = dict(cite=_cite(_ABB, 177))
# s.177:n oma lause liittolaismatriisin rinnalle: sama kielto, kirjan sivulla.
assert _EX.get("ally_xenos") and _EX["ally_xenos"]["when"] == "space marines"
_EX["ally_xenos"]["src"] = _AUX3 + " (Fleets p. 177) " + _EX["ally_xenos"]["src"]
print("J219: Explorationin apualukset ja liittolais-battleship")

# J220 (check yourself -vaihe 6D). s.369 CLAN UPGRADES: "A Blood Axe tiddla
# skwadron of at least six escorts may include up to three Imperial Navy and/or
# Chaos escorts from any fleet list at their listed cost." Kommandeeratut
# saattajat omaan osioonsa (IN- ja Chaos-listojen ESCORTS, runko kerran,
# Armageddonin tahdelliset Space Marine -rivit pois, s.41), PD:n edelle.
# Laivue (sq) liittaa ne Blood Axe -tiddlaan.
_BA_S = ("A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos "
         "escorts from any fleet list at their listed cost.")
assert _text_key(_BA_S) in _all_text
_ba_ents, _ba_seen = [], set()
for _L in lists_out:
    if not re.match(r"^(Imperial Navy|Chaos) —", _L["nm"]):
        continue
    for _s in _L["secs"]:
        if _s["t"].strip().upper() != "ESCORTS" or _s.get("ct") != "type":
            continue
        for _e in _s["ents"]:
            if _e.get("k") != "unit" or "*" in _e["l"] or str(_e.get("r")) in _ba_seen:
                continue
            _ba_seen.add(str(_e.get("r")))
            _n = _copy.deepcopy(_e)
            _n["l"] = _e["l"][:1].upper() + _e["l"][1:].lower().replace("class", "class")
            _n["src_page"] = 369
            _ba_ents.append(_n)
assert len(_ba_ents) == 9, [e["l"] for e in _ba_ents]
_pd = [i for i, s in enumerate(_CZL["secs"]) if s.get("ct") == "defence"]
assert _pd == [len(_CZL["secs"]) - 1], _pd
_shift_section_refs(_CZL, _pd[0])
_CZL["secs"].insert(_pd[0], dict(t="BLOOD AXE COMMANDEERED ESCORTS", text=[_BA_S], ents=_ba_ents, rules=[],
                                 ct="access", noroute=1))
_CZL["bloodaxe"] = dict(sec="^BLOOD AXE COMMANDEERED ESCORTS$", clan="^clan: blood axes", min=6, max=3,
                        cite=_cite(_BA_S, 369))
# s.454/456: "Any ship equipped with Wardens can only be equipped with Wardens
# and may not have other hook-transported escorts." Laivastotasolla: Wardenit
# ja Orcat on voitava jakaa eri aluksille koukkujen mukaan (sh.hk).
_WD_S = ("Any ship equipped with Wardens can only be equipped with Wardens and may not have other hook-transported "
         "escorts.")
assert _text_key(_WD_S) in _all_text
for _nm in ("Tau — Merchant Fleet", "Tau — Commerce Protection"):
    _p18_list(_nm)["warden_only"] = dict(cite=_cite(_WD_S, 454))
print("J220: Blood Axen kommandeeratut saattajat %d, Warden-jako 2 listalla" % len(_ba_ents))

# J221 s.177: "Reserves and Allied vessels do not have access to the Veteran
# Rogue Trader re-rolls, but allied vessels may purchase up to one special
# character from its own fleet list (if available)." Erikoishahmo = listan
# nimetty komentaja; tavallinen Admiral, Pirate Prince tai Eldar Hero ei ole.
_SC_S = ("Reserves and Allied vessels do not have access to the Veteran Rogue Trader re-rolls, but allied vessels may "
         "purchase up to one special character from its own fleet list (if available).")
assert _text_key(_SC_S) in _all_text
_SC_RE = r"^(lord admiral rath|abaddon|prince yriel|iyanden bearer of the flame|kor.o.mesme)"
_sc_hits = sorted(set(e["l"] for _L in lists_out for _s in _L["secs"] for e in (_s.get("ents") or [])
                      if e.get("k") == "cmd" and re.search(_SC_RE, e["l"], re.I)))
assert len(_sc_hits) == 5, _sc_hits
_EX["ally_cmd"] = dict(re=_SC_RE, max=1, cite=_cite(_SC_S, 177))
print("J221: Explorationin liittolaisen erikoishahmot: %s" % ", ".join(_sc_hits))

# Loppuvartija: jokainen osioviittaus osoittaa siihen osioon, jonka nimen se
# kantaa. Taman jalkeen luodut saannot (moduulitason lisaykset) leimataan
# nyt - niiden indeksit on kirjoitettu vasta kaikkien siirtojen jalkeen.
check_section_names(lists_out, "lopuksi")
_refs = [0, 0]
for _L in lists_out:
    for _s in _L["secs"]:
        count_section_refs(_s.get("rules") or [], _refs)
assert _refs[0] == _refs[1], ("nimettomia osioviittauksia: %d / %d"
                              % (_refs[0] - _refs[1], _refs[0]))
print("osioviittauksia %d, kaikki nimettyja; tarkistettu siirtojen jalkeen %d"
      % (_refs[0], _SEC_COUNT[1]))

refd = {str(e["r"]) for Lx in lists_out for s in Lx["secs"] for e in s["ents"] if e["r"]}
missing = sorted(r for r in refd if r not in ships)

data = dict(src="Battlefleet Gothic: Remastered — Fleets Book WiP v0.36 (28 Aug 2025) "
                "and Rulebook v1.10 (7 May 2024)",
            ships=ships, lists=lists_out)
# Saannon kantavuus riippuu siita, mihin `re` osuu. Jos rivin nimi muuttuu
# kirjassa tai poiminnassa, kielto lakkaa hiljaa toimimasta - siksi osumat
# lasketaan: ne ovat vain Rogue Traders -listoilla ja niita on kolme per lista
# plus yleinen rivi.
import re as _rex
_xre = _rex.compile(ALLY_XENOS["re"], _rex.I)
_xhit, _xbad = {}, []
for _L in lists_out:
    for _sec in _L["secs"]:
        for _e in _sec["ents"]:
            if _e.get("k") != "unit": continue
            if not _xre.search(str(_e.get("l", ""))): continue
            _xhit[_L["nm"]] = _xhit.get(_L["nm"], 0) + 1
            # Rivi on joko Rogue Tradersin oma tai jonkin listan nimetty
            # paasy niihin (Tau Commerce Protection ja Demiurg painavat saman
            # neljan rivin lohkon omaan osioonsa). Muualla sita ei saa olla:
            # silloin `re` osuisi johonkin muuhun kuin siihen mita lause
            # tarkoittaa.
            if "Rogue Traders" not in _L["nm"] and _sec.get("ct") != "access":
                _xbad.append("%s / %s / %s" % (_L["nm"], _sec["t"], _e["l"]))
assert _xhit, "ALLY_XENOS.re ei osu yhteenkaan riviin"
assert not _xbad, "Xenos-rivi vaarassa paikassa: %s" % _xbad
assert sorted(_xhit.values()) == [4] * 5, "Xenos-rivien maara muuttui: %r" % _xhit

# ---------------------------------------------- kirjan luvut ja "oma" runko
# Isantalistan oma sivu voi tarjota toisen laivaston aluksia (Chaos-listojen
# RENEGADE IMPERIAL VESSELS s.222, Bastionin Chaos-rungot s.39). Poimija
# nayttaa sellaisen lahdelistan keltaisena, ja sita varten on tiedettava,
# mitka lahdelistan rungoista ovat SEN OMIA. Runkoviite ei yksin riita: Space
# Marine -listat painavat Imperial Navyn profiileja rapid strike vesseleina,
# jotka ovat Space Marine -aluksia ("you can't just take your Imperial Navy
# escorts and say that they are rapid strike vessels!", s.106), ja Demiurg
# painaa Rogue Trader Cruiserin omien risteilijoidensa joukkoon (s.487).
# Viitteella nama nayttivat reiteilta: 23 vaaraa 68:sta.
#
# Oma = profiili on painettu lahdelistan OMASSA luvussa. Ensimmainen versio
# liitti mukaan saman rodun luvut, jolloin Imperial Navy -luvun rungot olivat
# Adeptus Mechanicukselle omia (s.14 "Imperial Navy (including Adeptus
# Mechanicus)"). Katselmointi 16.9. osoitti sen vaaraksi: s.14:n rotujako
# koskee reserveja, ja renegaatit "do not count as reserves" (s.222), kun taas
# s.222 sanoo "from any Imperial Navy fleet list" ja Mechanicus on oma listansa
# (s.124 "ADEPTUS MECHANICUS FLEET LIST", s.125 "replaces the original cost for
# these vessels when used as Adeptus Mechanicus ships"). Pelaajalta ei katoa
# mitaan: jokainen Explorator-reitin rivi on saatavilla Imperial Navy
# -listojen kautta.
#
# Luvut: listojen omien saantoikkunoiden alut ja lisaksi kirjan kaksi
# listatonta lukua sisallysluettelosta (PDF s.9): PLANETARY DEFENCES 496 ja
# ADDITIONAL VESSELS 518. Ilman niita sivujen 500-524 profiilit (Ramilies,
# orbitaalit, Q-ship ...) olisivat Demiurg-luvun "omia".
_CHAP_RE = re.compile(r"FLEET RULES \(pg\.?\s*(\d+)")
_chap_of_list = {}
for _L in lists_out:
    _m = _CHAP_RE.search(str(_L["secs"][0].get("t", "")))
    assert _m, "luvun alkua ei loydy: %s (%r)" % (_L["nm"], _L["secs"][0].get("t"))
    _chap_of_list[_L["nm"]] = int(_m.group(1))
_LISTLESS = (496, 518)
_STARTS = sorted(set(_chap_of_list.values()) | set(_LISTLESS))
def _chapter_of(pg):
    if pg is None:
        return None
    _c = [x for x in _STARTS if x <= int(pg)]
    return _c[-1] if _c else None
for _k, _sh in ships.items():
    _sh["chap"] = _chapter_of(_sh.get("pg"))
_NATIVE = 0
for _L in lists_out:
    _L["native_chaps"] = [_chap_of_list[_L["nm"]]]
    _NATIVE += 1
assert _NATIVE == len(lists_out) == 32, _NATIVE
# Listattoman luvun profiili ei ole kenenkaan oma, eika sivun 482 jalkeen
# painettu profiili saa jaada Demiurg-lukuun.
assert not [_L["nm"] for _L in lists_out
            if set(_L["native_chaps"]) & set(_LISTLESS)], "listaton luku omana"
_late = [_sh["nm"] for _sh in ships.values()
         if _sh.get("pg") and int(_sh["pg"]) >= 496 and _sh.get("chap") not in _LISTLESS]
assert not _late, "sivun 496 jalkeen luku vaarin: %r" % _late[:5]
print("lukualkuja: %d (joista listattomia %d), listoja joilla oma luku: %d"
      % (len(_STARTS), len(_LISTLESS), _NATIVE))

# ---------------------------------------------- Mark joka tulee valmiina
# Kun Mark on aluksessa kiinteana - jumalan oma battle barge (s.258, 260, 262,
# 264) tai Daemonship Nurglen, Khornen ja Slaaneshin listoilla ("already
# included in the cost to upgrade them to Daemonships") - pelaaja ei nahnyt
# sita aluksen paivityksissa lainkaan, vaan vain kortin tekstissa. Nyt siita
# on lukittu 0 pisteen rivi, samalla mekanismilla kuin Mechanicuksen
# pakolliset refitit: `req` lukitsee ja `incl` kertoo kayttoliittymalle, etta
# se on "included" eika "required by the fleet list".
#
# Nimi alkaa "Mark of", EI "The Mark of", tarkoituksella. Kolme asiaa lukee
# "^the mark of" -alkua: kortin Mark-saanto (joka lisaisi Terminus Estille
# toisen rivin "+1 Damage Point" vaikka osuma on jo profiilissa), ostettavien
# Markkien ryhma, ja J139:n mark_paid. Inforivi ei saa muuttaa niista mitaan.
# Rivilla ei myoskaan ole `mod`-kenttaa: miehiston Mark of Nurgle antaa
# hp +1, ja se kaksinkertaistaisi bargen osuman.
#
# Tzeentchin Daemonship ei saa rivia, koska sen lista ei sano Markin
# sisaltyvan - siella Mark ostetaan erikseen.
def _bears(ship_re, god):
    for _sh in ships.values():
        if re.match(ship_re, _sh.get("nm", ""), re.I):
            for _b in (_sh.get("sr") or "").split("•"):
                _b = _b.strip()
                _m = re.search(r"This ship bears the Mark of %s as part of its point cost;"
                               r" it does not have to be paid for separately by the ship.s"
                               r" commander\." % god, _b)
                if _m:
                    return _m.group(0), _sh["pg"]
    return None, None
# J165: lauseen sivu listan liimatusta saantotekstista (lists.py page_map).
def _sent_page(L, sent):
    _li = lists_out.index(L)
    _blob, _pm = upgrades._joined(raw_rules[_li], raw_pages[_li])
    _i = _blob.find(sent[:60])
    assert _i >= 0, "%s: lausetta ei loydy saantotekstista: %s" % (L["nm"], sent[:60])
    return upgrades._page_at(_pm, _i)
def _daemon_incl(L, god):
    for _sec in L["secs"]:
        if "DAEMON" not in _sec["t"].upper():
            continue
        for _t in _sec.get("text") or []:
            _m = re.search(r"All Daemonships in a [^.]*? must take the Mark of %s, which is"
                           r" already included in the cost to upgrade them to"
                           r" Daemonships\." % god, _t)
            if _m:
                return _sec, _m.group(0)
    return None, None
def _incl_row(god, cond, desc, page):
    return {"l": "Mark of %s" % god, "r": None, "p": 0, "a": 1, "u": 1, "mx": None,
            "nt": None, "prose": 1, "cond": cond, "k": "up", "req": 1, "incl": 1,
            "desc": desc, "src_page": page}
_BARGE = {"Nurgle": "TERMINUS EST", "Tzeentch": "SCION OF PROSPERO",
          "Khorne": "SLAVERER", "Slaanesh": "WAGE OF SIN"}
_INCL = 0
for _god, _barge in _BARGE.items():
    _L = [x for x in lists_out if x["nm"] == "Chaos — " + _god]
    assert len(_L) == 1, _god
    _L = _L[0]
    _fc = [x for x in _L["secs"] if "FORCES OF CHAOS" in x["t"].upper()]
    assert len(_fc) == 1, "%s: FORCES OF CHAOS -osioita %d" % (_god, len(_fc))
    _sent, _bpg = _bears("^" + _barge, _god)
    assert _sent, "%s: bargen Mark-lausetta ei loydy profiilista" % _god
    # Loppuun, ei valiin: osion vanhat rivit pitavat indeksinsa, joten
    # tallenteiden paivitysavaimet eivat liiku.
    _fc[0]["ents"].append(_incl_row(_god, {"nm": "^" + _barge.lower()}, _sent, _bpg))
    _INCL += 1
    _dsec, _dsent = _daemon_incl(_L, _god)
    if _god == "Tzeentch":
        assert _dsent is None, "Tzeentch: Daemonship-lause ilmestyi - tarkista kirja"
        continue
    assert _dsent, "%s: Daemonshipin Mark-lausetta ei loydy" % _god
    _dsec["ents"].append(_incl_row(_god, {"cap": 1, "up": "^daemonship:"}, _dsent, _sent_page(_L, _dsent)))
    _INCL += 1
assert _INCL == 7, "Mark-inforiveja %d, odotettiin 7" % _INCL
print("valmiina tulevan Markin inforivit: %d" % _INCL)

# Jumalan oma battle barge kantaa Markin jo hinnassaan, joten Warmasterin
# Mark-rivi ei saa veloittaa sita toiseen kertaan. Kirjan lause on sama
# neljassa kohdassa, ja Nurglella siihen on lisatty se mika nakyy myos
# profiilissa (hp 13 vs. tavallisen battle bargen 12).
#
# Milloin Warmaster on bargen kyydissa? Kirja sanoo sen aluksen omassa
# saannossa, eika sita tarvitse paatella:
#   Terminus Est / Scion of Prospero / Wage of Sin: "must be used as the
#   fleet's flagship and have its Warmaster placed aboard it UNLESS the
#   Planet Killer is also present, in which case a Chaos Lord must lead it."
#   Slaverer on poikkeus: "it does not have to be used as the fleet's
#   flagship UNLESS IT IS THE MOST EXPENSIVE VESSEL PRESENT", ja "if it is
#   not the flagship, a Chaos Lord must lead it."
import re as _re
_PK = "^planet killer"
MARK_PAID = {
    "Chaos — Nurgle": dict(
        god="Nurgle", ship="^terminus est$", unless=_PK, pg=262,
        src_ship="Mark of Nurgle: This ship bears the Mark of Nurgle as part "
            "of its point cost; it does not have to be paid for separately by "
            "the ship's commander. The extra hit is already included in its "
            "profile.",
        src_flag="If chosen, the Terminus Est must be used as the fleet's "
            "flagship and have its Warmaster placed aboard it unless the "
            "Planet Killer is also present, in which case a Chaos Lord must "
            "lead it."),
    "Chaos — Tzeentch": dict(
        god="Tzeentch", ship="^scion of prospero$", unless=_PK, pg=258,
        src_ship="Mark of Tzeentch: This ship bears the Mark of Tzeentch as "
            "part of its point cost; it does not have to be paid for "
            "separately by the ship's commander.",
        src_flag="If chosen, the Scion of Prospero must be used as the "
            "fleet's flagship and have its Warmaster placed aboard it unless "
            "the Planet Killer is also present, in which case a Chaos Lord "
            "must lead it."),
    "Chaos — Slaanesh": dict(
        god="Slaanesh", ship="^wage of sin$", unless=_PK, pg=260,
        src_ship="Mark of Slaanesh: This ship bears the Mark of Slaanesh as "
            "part of its point cost; it does not have to be paid for "
            "separately by the ship's commander.",
        src_flag="If chosen, the Wage Of Sin must be used as the fleet's "
            "flagship and have its Warmaster placed aboard it unless the "
            "Planet Killer is also present, in which case a Chaos Lord must "
            "lead it."),
    "Chaos — Khorne": dict(
        god="Khorne", ship="^slaverer$", dearest=1, pg=264,
        src_ship="Mark of Khorne: This ship bears the Mark of Khorne as part "
            "of its point cost; it does not have to be paid for separately by "
            "the ship's commander. If it is not the flagship, a Chaos Lord "
            "must lead it.",
        src_flag="If chosen, it does not have to be used as the fleet's "
            "flagship unless it is the most expensive vessel present."),
}
_MP = 0
for _L in lists_out:
    _mp = MARK_PAID.get(_L["nm"])
    if not _mp:
        continue
    # Rivien on oltava olemassa, tai saanto valvoisi tyhjaa.
    # Tasan yksi alusrivi: Slaanesh-listalla on myos paivitysrivi "Wage of
    # Sin: Chosen Terminators (crew included)", joten ankkuroimaton lauseke
    # osuisi kahteen riviin. Saanto suojaa itsensa unitRow-ehdolla, mutta
    # lauseke pidetaan silti tarkkana ja maara kirjattuna.
    _ships = [_e["l"] for _sec in _L["secs"] for _e in _sec["ents"]
              if _e.get("k") == "unit"
              and _re.search(_mp["ship"], str(_e.get("l", "")), _re.I)]
    assert len(_ships) == 1, "MARK_PAID: %s osuu %d alukseen: %r" % (
        _mp["ship"], len(_ships), _ships)
    _has_ship = True
    _has_mark = any(_e.get("dflt") and str(_e.get("l", "")).lower()
                    .startswith("the mark of")
                    for _sec in _L["secs"] for _e in _sec["ents"])
    assert _has_ship, "MARK_PAID: alusta ei ole listalla %s" % _L["nm"]
    assert _has_mark, "MARK_PAID: oletusvalittua Mark-rivia ei ole %s" % _L["nm"]
    _L["mark_paid"] = dict(_mp)
    _MP += 1
assert _MP == 4, "MARK_PAID: odotettiin 4 listaa, saatiin %d" % _MP
# Pakollisia paivityksia jaa vain Mechanicuksen kaksi 0 pisteen refittia.
_REQ = [(_L["nm"], _e["l"]) for _L in lists_out for _sec in _L["secs"]
        for _e in _sec["ents"] if _e.get("k") == "up" and _e.get("req")
        and not _e.get("incl")]
assert len(_REQ) == 2, "pakollisia paivityksia %d: %r" % (len(_REQ), _REQ)

# Ohjausmerkki datan merkkijonossa. check_control.py lukee tiedostojen tavuja,
# mutta JSON kirjoittaa askelpalauttimen (U+0008) kahtena ASCII-merkkina, joten
# tavutarkistus ei nae sita. Nain kavi 16.9.: Python-merkkijonon paosarja
# muuttui ehdon saannolliseen lausekkeeseen askelpalauttimeksi, eika Mark-
# inforivi osunut yhteenkaan bargeen. Viides kerta samalle ansalle.
def _ctrl_walk(v, path, out):
    if isinstance(v, str):
        if any(ord(ch) < 32 and ch not in (chr(10), chr(9), chr(13)) for ch in v):
            out.append(path)
    elif isinstance(v, dict):
        for _k, _x in v.items():
            _ctrl_walk(_x, path + "." + str(_k), out)
    elif isinstance(v, list):
        for _n, _x in enumerate(v):
            _ctrl_walk(_x, path + "[%d]" % _n, out)
_CTRL = []
_ctrl_walk(data, "data", _CTRL)
assert not _CTRL, "ohjausmerkki datan merkkijonossa: %s" % _CTRL[:5]

# PDF:n rivinvaihto katkaisee sanan "re-roll" tavuviivan kohdalta, ja poimittu
# teksti sanoo "re- roll" (s.147, 151, 258, 373, 404, 486). Kortti ja
# valintalista tulostavat datan sellaisenaan, joten sana korjataan tassa
# kaikista merkkijonoista kerralla - saannon lause ja sen sec.text-pari
# pysyvat nain tavulleen samoina (kayttaja 5.10.2026: re-rollit selkeasti).
_REROLL_HYPH = [0]
def _fix_reroll(v):
    if isinstance(v, str):
        _n = v.count("re- roll") + v.count("Re- roll")
        if _n:
            _REROLL_HYPH[0] += _n
            return v.replace("re- roll", "re-roll").replace("Re- roll", "Re-roll")
        return v
    if isinstance(v, dict):
        for _k in list(v):
            v[_k] = _fix_reroll(v[_k])
        return v
    if isinstance(v, list):
        for _n2 in range(len(v)):
            v[_n2] = _fix_reroll(v[_n2])
        return v
    return v
_fix_reroll(data)
assert _REROLL_HYPH[0] >= 1, "'re- roll' -korjaus ei osunut kertaakaan: onko poimija muuttunut?"
print("'re- roll' -> 're-roll': %d kohtaa" % _REROLL_HYPH[0])

# --- Osion lauseiden ryhmat (docs/check-yourself, J212, 20.10.2026) --------
# Ennen kaikki osion lauseet, joita saman osion saannon src ei ollut sana
# sanalta, naytettiin "Check yourself" -ryhmassa: 2 497 esiintymaa, joista
# kasin luettuna vain 15 oli pelaajan tarkistettavia. Nyt jokainen lause saa
# ryhman (sec.cls) referenssi/check_yourself.json:n kasiluokituksesta:
#   checked  builder valvoo tai rakenne estaa rikkomisen
#   open     kirjan saanto, jota builder ei valvo (Not checked by the builder)
#   info     laivaston tieto (attack rating, vastustajan edut)
#   models   mallit ja maalaus
#   play     pelin aikainen saanto      campaign  kampanja ja skenaario
#   row      rivin kuvaus               drop      kerronta: ei katalogiin
# Saman osion saannon src on aina "checked" (vanha ehto). Lause, jota
# luokitus ei tunne, on "open" - pelaaja nakee sen tarkistamattomana - ja
# check_reference.py raportoi sen. Kortit eivat lue cls:aa: ne valitsevat
# lauseensa kuten ennen (sec.own), joten korttien sisalto ei muutu.
def _cy_key(t):
    t = (t or "").replace("’", "'").replace("‘", "'")
    return re.sub(r"[^a-z0-9']+", " ", t.lower()).strip()
_CY = json.load(io.open(os.path.join("referenssi", "check_yourself.json"), encoding="utf-8"))
_cy_map = dict((_cy_key(_e["text"]), _e) for _e in _CY["sentences"])
_cy_hit, _cy_unknown, _cy_n = set(), [], {}
for _L in lists_out:
    for _s in _L["secs"]:
        _srcs = [_r.get("src") for _r in (_s.get("rules") or [])]
        _cls, _pg = [], []
        for _t in (_s.get("text") or []):
            _e = _cy_map.get(_cy_key(_t))
            if _e:
                _cy_hit.add(_e["id"])
            if _t in _srcs:
                _g = "checked"
            elif _e is None:
                _g = "open"
                _cy_unknown.append((_L["nm"], _s["t"], _t[:70]))
            elif _L["nm"] in (_e.get("drop_in") or []):
                _g = "drop"
            else:
                _g = (_e.get("g_by_list") or {}).get(_L["nm"], _e["g"])
            _cls.append(_g)
            _pg.append(_e.get("p") if _e else None)
            _cy_n[_g] = _cy_n.get(_g, 0) + 1
        _s["cls"] = _cls
        _s["cpg"] = _pg
assert len(_cy_hit) >= 1000, "check_yourself.json osuu vain %d lauseeseen: onko poiminta muuttunut?" % len(_cy_hit)
print("osion lauseiden ryhmat: %s, luokittelematta %d, luokitusta ei kaytetty %d"
      % (_cy_n, len(_cy_unknown), len(_CY["sentences"]) - len(_cy_hit)))
for _u in _cy_unknown[:5]:
    print("  luokittelematon: %s / %s: %s" % _u)

io.open("bfg_data.json", "w", encoding="utf-8").write(
    json.dumps(data, ensure_ascii=True, separators=(",", ":")))

print("aluksia %d, listoja %d" % (len(ships), len(lists_out)))
print("saannot:", {k: v for k, v in stat.items() if k != "text"},
      " valvottavia yhteensa", sum(v for k, v in stat.items() if k != "text"))
print("naytettavia saantolauseita:", stat["text"])
print("puuttuvat profiilisivut:", missing)
print("bfg_data.json %.0f kB" % (os.path.getsize("bfg_data.json") / 1024))

# --- vartijan punaisuustodiste -------------------------------------------
# Vartija, joka ei osaa kaataa buildia, ei ole vartija. Tassa tilassa
# jokaiseen listaan tyonnetaan yksi osio eteen - tasan se hiljainen siirtyma,
# jota vastaan nimet on kirjoitettu - ja vaaditaan, etta jokainen lista
# kaatuu. Data on jo kirjoitettu levylle, joten muutos elaa vain muistissa.
if "--prove-guard" in sys.argv:
    survived = []
    for _L in lists_out:
        _moved = [dict(t="TYONNETTY OSIO", ents=[], rules=[])] + _L["secs"]
        try:
            stamp_section_names(_moved, "todiste: " + _L["nm"], stamp_new=False)
        except AssertionError:
            continue
        # Lista, jonka yhdellakaan saannolla ei ole osioviittausta, ei voi
        # kaatua - se kirjataan, ei hyvaksyta hiljaisesti.
        _refs = sum(1 for _sec in _L["secs"] for _r in (_sec.get("rules") or [])
                    for _k in _r if _k.endswith("_sn") or _k == "sn")
        survived.append((_L["nm"], _refs))
    _silent = [x for x in survived if x[1]]
    assert not _silent, ("osiosiirtyma ei kaatanut vartijaa: %s" % _silent)
    print("VARTIJA: osiosiirtyma kaataa buildin %d/%d listalla"
          % (len(lists_out) - len(survived), len(lists_out)))

    # Rotu- ja tyyppitaulut: sama koe. Poistetaan yksi rivi kerrallaan ja
    # vaaditaan, etta vartija huomaa puutteen.
    _lost = dict(lists_out[0]); _lost.pop("race")
    try:
        check_races([_lost])
        raise SystemExit("VARTIJA: rodun puuttuminen ei kaatanut buildia")
    except AssertionError:
        pass
    _shl = dict(ships); _shl["_koe"] = dict(ships["53"]); _shl["_koe"].pop("rt")
    try:
        check_ship_types(_shl)
        raise SystemExit("VARTIJA: alustyypin puuttuminen ei kaatanut buildia")
    except AssertionError:
        pass
    _shipsec = next(sec for sec in lists_out[0]["secs"]
                    if any(e.get("r") and e.get("k") != "up" for e in (sec.get("ents") or [])))
    _sk = {"nm": "koe", "secs": [dict(_shipsec)]}
    _sk["secs"][0].pop("ct", None)
    try:
        check_section_kinds([_sk])
        raise SystemExit("VARTIJA: osion lajin puuttuminen ei kaatanut buildia")
    except AssertionError:
        pass
    print("VARTIJA: rodun, alustyypin ja osion lajin puuttuminen kaatavat buildin")
    if survived:
        print("  (ilman osioviittauksia: %s)"
              % ", ".join(n for n, _ in survived))
