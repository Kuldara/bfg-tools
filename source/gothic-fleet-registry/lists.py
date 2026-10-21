# -*- coding: utf-8 -*-
"""Poimii laivastolistat (osiot, saantoteksti, rivit) Fleets WiP -PDF:sta."""
import fitz, json, re, io

SRC = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
d = fitz.open(SRC)
profiles = json.load(io.open("profiles_raw.json", encoding="utf-8"))
PROFILE_PAGES = {p["page"] for p in profiles}

# (nimi, aloitussivu) — poimittu profiilien FLEET LISTS -viittauksista
LISTS = [
    ("Imperial Navy — Gothic Sector", 35),
    ("Imperial Navy — Bastion Fleets", 36),
    ("Imperial Navy — Armageddon Sector", 40),
    ("Imperial Navy — Bakka Sector", 48),
    ("Space Marines — Codex Astartes", 97),
    ("Space Marines — Crusade", 98),
    ("Space Marines — Dominion", 100),
    ("Adeptus Mechanicus — Explorator", 124),
    ("The Emperor's Inquisition", 138),
    # Sivulla 144 on oma otsikko "GREY KNIGHTS FLEET LIST" ja sen alla
    # oma FLEET COMMANDER, CAPITAL SHIPS, ESCORTS ja ATTACK RATING.
    # Ilman tata riviä se sulautui Inkvisitioon, jolloin listassa oli
    # kaksi komentaja- ja kaksi runko-osiota eri hinnoilla.
    ("Grey Knights", 144),
    ("Rogue Traders", 174),
    ("Rogue Traders — Exploration", 176),
    ("Rogue Traders — Pirates and Wolf Packs", 178),
    ("Chaos — Incursion", 232),
    ("Chaos — Black Crusade", 234),
    ("Chaos — Tzeentch", 236),
    ("Chaos — Nurgle", 240),
    ("Chaos — Khorne", 244),
    ("Chaos — Slaanesh", 248),
    # Kirjassa on kaksi Eldar Corsairs -listaa: sivun 316 otsikko on
    # "GOTHIC SECTOR" ja sivun 317 "LATER GOTHIC WAR". Vain
    # jalkimmaisessa on Void Stalker -taistelulaiva ja kaksi
    # kevytristeilijaa. Ilman erotusta ne nakyivat yhtena listana,
    # jossa oli kaksi komentajaosiota.
    ("Eldar Corsairs \u2014 Gothic Sector", 316),
    ("Eldar Corsairs \u2014 Later Gothic War", 317),
    ("Eldar — Iyanden Craftworld", 318),
    ("Dark Eldar — Pirates", 351),
    ("Orks — Cyclops Cluster", 365),
    ("Orks — Waaagh!", 366),
    ("Orks — Da Ork Clanz", 372),
    ("Necrons — Harvest Fleet", 404),
    ("Tyranids — Vanguard Fleet", 429),
    ("Tyranids — Hive Fleet", 430),
    ("Tau — Merchant Fleet", 454),
    ("Tau — Commerce Protection", 456),
    ("Demiurg — War Host", 486),
]
STARTS = sorted({pg for _, pg in LISTS})

# "(0–1) Nimi (pg. 377)........ 310 pts"   /   "Nimi (pg. 67)......255 pts"
ENTRY = re.compile(
    # Sulkeet ovat valinnaiset: kirja kayttaa seka "(0-1) Nimi" etta
    # "0-1 Nimi". Ilman sulkeita vaaditaan valilyonti, jottei "0-1" voi
    # olla osa nimea.
    r"^(?:\((?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\)\s*"
    r"|(?P<lo2>\d+)\s*[–-]\s*(?P<hi2>\d+)\s+)?"
    r"(?P<name>.+?)\s*\(pg\.\s*(?P<pg>\d+)\)\s*[\).\s]*?"
    # Numerohinta vaatii "pts": ilman sita mika tahansa lukuun paattyva
    # sisallysluettelon rivi nayttaisi listarivilta. Sanamuoto on
    # yksiselitteinen, joten silta paate ei ole pakollinen - kirja
    # kirjoittaa "......varies" ja "......Free" ilman sita.
    r"(?:(?P<pts>\+?[\d,]+)\s*pts?\.?"
    r"|(?P<word>Free|Special|Varies)\s*(?:pts?\.?)?)$", re.I)
# "One extra re-roll........+20 pts"  (ei sivuviitetta)
UPGRADE = re.compile(
    # Sama valinnainen maararajoite kuin ENTRY-kaavassa: kirja kirjoittaa
    # "0-3 Farseers.........+30 pts" ilman sivuviitetta.
    r"^(?:(?P<lo>\d+)\s*[\u2013-]\s*(?P<hi>\d+)\s+)?"
    r"(?P<name>[^.]+?)\s*\.{2,}\s*"
    r"(?:(?P<pts>\+?[\d,]+)\s*pts?\.?"
    r"|(?P<word>Free|Special|Varies)\s*(?:pts?\.?)?)$", re.I)
# osion otsikko: ISOT KIRJAIMET, tai lyhyt rivi ilman lopetusmerkkia
CAPS = re.compile(r"^[A-Z’'&\- ]{3,40}$")
# Kirjan otsikot joissa on pilkku. Pilkkua ei voi sallia kaavassa,
# koska kirjan kaksiriviset otsikot katkeaisivat sen takia vaarasta
# kohdasta ("XENOS FREEBOOTERS, CORSAIRS AND", "PRINCE YRIEL, BEARER
# OF THE"). Nama on luettu kirjasta ja tarkistettu yksitellen.
EXTRA_HEADS = {"ALLIES, SUBJECTS & MERCENARIES"}
_EXTRA_HEAD_HITS = []
# Kauttaviiva kuuluu otsikkoon: "Up to Three Port/Starboard Weapons"
# (tyranidien hive ship, s.430) ja "Reserve/allies" (Inkvisitio,
# s.140-142). Ilman sita ne valuivat edellisen osion sisaan, ja
# tyranideilta katosi kaksi aserivia kaksoiskappaleiden karsinnassa.
SUBHEAD = re.compile(r"^[‘'A-Z][\w’'\-/ ]{2,34}$")
# "0-12 Cruisers", "0-1 Admiral", "1-2 Kroozers" -- otsikko jossa on maararaja
COUNTHEAD = re.compile(r"^(?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\s+(?P<t>[‘'A-Z][\w’'\- ]{2,30})$")
# Sama maararaja voi olla nimen PERASSA sulkeissa: kirjan ainoa
# tallainen otsikko on "Kroot Vessels (0-3)" (Demiurg, s.487).
# Ilman tata Kroot Warsphere valui Cruisers-osioon, jossa kirja
# nimenomaan sanoo etteivat Warspheret laske risteilijoihin.
TAILCOUNT = re.compile(r"^(?P<t>[‘'A-Z][\w’'\-/ ]{2,30}?)\s*\((?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\)$")
_TAILCOUNT_HITS = []


def clean(s):
    return re.sub(r"\s+", " ", s).replace("\u2009", " ").strip()


def page_lines(pg):
    return [clean(l) for l in d[pg - 1].get_text().split("\n") if clean(l)]


def pages_of(start):
    """Listan sivut: alusta kunnes tulee profiilisivu tai seuraava lista."""
    out, p = [], start
    nxt = min([s for s in STARTS if s > start], default=10 ** 6)
    while p < nxt and p - start < 12:
        if p != start and p in PROFILE_PAGES:
            break
        out.append(p)
        p += 1
    return out


_OWNED = None


def owned_pages():
    """Kaikki sivut jotka kuuluvat jollekin listalle, ei vain aloitussivut."""
    global _OWNED
    if _OWNED is None:
        _OWNED = set()
        for s in STARTS:
            _OWNED.update(pages_of(s))
    return _OWNED


def rules_pages(start):
    """Listaa edeltavat yhtenaiset saantosivut (ei profiileja, ei toista listaa).

    Pysahdys tehtiin ennen vain listan ALOITUSSIVUUN, jolloin edellisen
    listan jatkosivut valuivat tahan lohkoon: Armageddonin "FLEET RULES
    (pg. 37-39)" oli Bastion-listan sivuja, ja sen omat koostumussaannot
    nakyivat Armageddonin saantoina. Nyt pysahdytaan mihin tahansa
    sivuun joka kuuluu jollekin listalle."""
    out, p = [], start - 1
    owned = owned_pages()
    while p > 0 and len(out) < 6 and p not in PROFILE_PAGES and p not in owned:
        out.append(p)
        p -= 1
    return sorted(out)


def page_map(lines, pages):
    """Liimatun saantotekstin sivurajat: [[merkki, sivu], ...] (J165).

    Saantorivit liimataan kappaleeksi valilyonnilla, ja sivu katoaa
    liimauksessa. Proosasta tehty rivi ("One extra re-roll") tarvitsee
    lauseensa sivun, joten jokainen sivunvaihto kirjataan merkkikohtana
    liimattuun tekstiin. Rivit ovat jo clean()-siivottuja, joten clean()
    liimauksen jalkeen ei siirra kohtia."""
    out, pos = [], 0
    for ln, pg in zip(lines, pages):
        if not out or out[-1][1] != pg:
            out.append([pos, pg])
        pos += len(ln) + 1
    return out


def parse_list(name, start):
    secs, cur = [], None
    warn = []
    rp = rules_pages(start)
    if rp:
        pre, pre_pg = [], []
        for pg in rp:
            for ln in page_lines(pg):
                if re.fullmatch(r"\d{1,3}", ln):
                    continue
                pre.append(ln)
                pre_pg.append(pg)
        if pre:
            secs.append(dict(title="FLEET RULES (pg. %d–%d)" % (rp[0], rp[-1]),
                             rules=[" ".join(pre)], entries=[],
                             pg=page_map(pre, pre_pg)))
    cur = None
    for pg in pages_of(start):
        for ln in page_lines(pg):
            if re.fullmatch(r"\d{1,3}", ln):        # sivunumero
                continue
            m = ENTRY.match(ln)
            if m and m.group("pg") and 40 <= int(m.group("pg")) <= 540:
                lo = m.group("lo") or m.group("lo2")
                hi = m.group("hi") or m.group("hi2")
                if cur is None:
                    cur = dict(title="Ships", rules=[], entries=[])
                    secs.append(cur)
                pts_s = (m.group("pts") or m.group("word")).replace(",", "")
                add = pts_s.startswith("+")
                try:
                    pts = int(pts_s.lstrip("+"))
                except ValueError:
                    # "Free" on nolla; "Varies" ja "Special" jaavat pelaajan
                    # syotettaviksi, koska kirja ei anna niille lukua.
                    pts = 0 if pts_s.lower() == "free" else None
                ref = int(m.group("pg"))
                lbl = re.sub(r"\s*\(pg\.\s*\d+\)", "", m.group("name"))
                e = dict(label=clean(lbl), ref=ref, pts=pts,
                         add=add, raw=ln, src_page=pg)
                if lo:
                    e["min"], e["max"] = int(lo), int(hi)
                if ref not in PROFILE_PAGES:
                    e["warn"] = "pg. %d ei ole profiilisivu" % ref
                    warn.append((name, ln))
                if pts is not None and pts > 1200:
                    e["warn"] = (e.get("warn", "") + " epäuskottava hinta").strip()
                    warn.append((name, ln))
                cur["entries"].append(e)
                continue
            u = UPGRADE.match(ln)
            if u and cur is not None and "pg." not in ln:
                pts_s = (u.group("pts") or u.group("word")).replace(",", "")
                try:
                    pts = int(pts_s.lstrip("+"))
                except ValueError:
                    pts = 0 if pts_s.lower() == "free" else None
                ue = dict(label=clean(u.group("name")), ref=None,
                          pts=pts, add=pts_s.startswith("+"),
                          upgrade=True, raw=ln, src_page=pg)
                if u.group("lo"):
                    ue["min"] = int(u.group("lo"))
                    ue["max"] = int(u.group("hi"))
                cur["entries"].append(ue)
                continue
            ch = COUNTHEAD.match(ln) or TAILCOUNT.match(ln)
            if ch:
                if TAILCOUNT.match(ln):
                    _TAILCOUNT_HITS.append((name, ln))
                cur = dict(title=ch.group("t").strip(), rules=[], entries=[],
                           lo=int(ch.group("lo")), hi=int(ch.group("hi")), head=ln)
                secs.append(cur)
                continue
            if ln in EXTRA_HEADS:
                _EXTRA_HEAD_HITS.append((name, ln))
            if (ln in EXTRA_HEADS or CAPS.match(ln)
                    or (SUBHEAD.match(ln) and len(ln.split()) <= 5
                        and not ln.endswith((".", ",", ":", ";")))):
                cur = dict(title=ln, rules=[], entries=[])
                secs.append(cur)
                continue
            if cur is None:
                cur = dict(title="Intro", rules=[], entries=[])
                secs.append(cur)
            cur["rules"].append(ln)
            cur.setdefault("lpg", []).append(pg)
            # Kirjan jarjestys kertoo kenelle rivi kuuluu: hinnoiteltua
            # rivia seuraavat rivit kuvaavat sita, kunnes tulee seuraava.
            # Ilman tata tieto katoaa kun rivit liimataan kappaleeksi.
            cur.setdefault("own", []).append(
                cur["entries"][-1]["label"] if cur["entries"] else None)
    # yhdista saantorivit kappaleiksi
    for s in secs:
        # Kuvaustekstit riveittain talteen ennen liimausta.
        if s.get("own"):
            d = {}
            for ln, ow in zip(s["rules"], s["own"]):
                if ow:
                    d.setdefault(ow, []).append(ln)
            if d:
                s["desc"] = {k: clean(" ".join(v)) for k, v in d.items()}
        s.pop("own", None)
        lpg = s.pop("lpg", None)
        if lpg:
            s["pg"] = page_map(s["rules"], lpg)
        s["rules"] = [clean(" ".join(s["rules"]))] if s["rules"] else []
    secs = [s for s in secs if s["entries"] or s["rules"]]
    return dict(name=name, start=start, pages=pages_of(start), sections=secs), warn


out, warns = [], []
for n, p in LISTS:
    L, w = parse_list(n, p)
    out.append(L)
    warns += w

io.open("lists_raw.json", "w", encoding="utf-8").write(
    json.dumps(out, ensure_ascii=False, indent=1))
tot = sum(len(s["entries"]) for L in out for s in L["sections"])
print("listoja %d, osioita %d, rivejä %d" %
      (len(out), sum(len(L["sections"]) for L in out), tot))
assert len(_EXTRA_HEAD_HITS) == 2, (
    "nimetty otsikko ei osunut kahdesti: %s" % _EXTRA_HEAD_HITS)
print("nimettyja otsikoita: %d" % len(_EXTRA_HEAD_HITS))
assert len(_TAILCOUNT_HITS) == 1, (
    "sulkeissa oleva maararaja ei osunut kerran: %s" % _TAILCOUNT_HITS)
print("sulkeissa olevia maararajoja: %d" % len(_TAILCOUNT_HITS))
print("varoituksia %d:" % len(warns))
for n, ln in warns[:15]:
    print("   %-34s %s" % (n[:34], ln[:80]))
