# -*- coding: utf-8 -*-
"""Ristiintarkistaa oman datan BSData/battlefleetgothic -katalogeja vasten.

    python crosscheck_bsdata.py            # kayttaa valimuistia, lataa jos tyhja
    python crosscheck_bsdata.py --refresh  # hakee tuoreet tiedostot GitHubista

MIKSI TAMA ON HYODYLLINEN

audit.py vertaa oman datan takaisin lahde-PDF:aan. Se todistaa etta poiminta
vastaa PDF:aa, mutta ei etta PDF olisi luettu oikein siina kohdin missa
taulukon geometria on hankala. BSData on TOINEN, taysin riippumaton
kasinsyotetty lahde samoista aluksista, joten se paljastaa juuri ne kohdat
joissa oma lukutapa olisi voinut mennä pieleen.

MITA TAMA EI OLE

BSData seuraa alkuperaista BFG-kompendiumia (2010 + FAQ), oma datamme
Remastered WiP:ia. Hinnat ja osa arvoista poikkeavat TARKOITUKSELLA, eika
ero ole virhe. Tama ei voi kumota lahde-PDF:aa - se kertoo vain missa
kohdin kaksi lahdetta eroavat, jotta ne voi katsoa kasin.

Lahde: https://github.com/BSData/battlefleetgothic (yhteison yllapitama,
BattleScriben datafile-repo). Tiedostot noudetaan valimuistiin
bsdata_cache/, jota ei tarvita ohjelman ajamiseen - vain tahan.
"""
import io, json, os, re, sys, glob, collections
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "bsdata_cache")
RAW = "https://raw.githubusercontent.com/BSData/battlefleetgothic/master/"
FILES = ["Adeptus_Mechanicus.cat", "Battlefleet_Gothic.gst", "Chaos.cat",
         "Dark Eldar.cat", "Eldar.cat", "Imperial Heresy Era.cat",
         "Imperium.cat", "Inquisition.cat", "Necron.cat", "Orks.cat",
         "Pirates and Wolf Packs.cat", "Space Marines.cat", "Tau.cat",
         "Tyranid.cat"]


def fetch(force=False):
    import urllib.request, urllib.parse
    if not os.path.isdir(CACHE):
        os.makedirs(CACHE)
    for f in FILES:
        dst = os.path.join(CACHE, f)
        if os.path.exists(dst) and not force:
            continue
        url = RAW + urllib.parse.quote(f)
        sys.stdout.write("  haetaan %s ... " % f)
        sys.stdout.flush()
        with urllib.request.urlopen(url, timeout=60) as r:
            data = r.read()
        io.open(dst, "wb").write(data)
        print("%d kt" % (len(data) // 1024))


# ------------------------------------------------------------------ XML-apurit
NS = re.compile(r"^\{[^}]*\}")


def tag(e):
    return NS.sub("", e.tag)


def kids(e, name):
    return [c for c in e if tag(c) == name]


def own_profiles(e):
    """Vain taman entryn omat profiilit; e.iter() sekoittaisi emon ja lapsen."""
    out = []
    for h in kids(e, "profiles"):
        out += kids(h, "profile")
    return out


def chars(p):
    d = {}
    for h in kids(p, "characteristics"):
        for ch in h:
            d[ch.get("name")] = (ch.text or "").strip()
    return d


def walk(e, out=None):
    out = [] if out is None else out
    out.append(e)
    for c in e:
        walk(c, out)
    return out


def cost_of(e):
    for h in kids(e, "costs"):
        for x in h:
            if (x.get("name") or "").strip().lower() in ("pts", "points"):
                try:
                    return int(float(x.get("value")))
                except (TypeError, ValueError):
                    return None
    return None


def clean(n):
    n = re.sub(r"\s*Profile$", "", str(n or "").strip(), flags=re.I)
    return re.sub(r"\s+", " ", n)


# --------------------------------------------------------------- BSDatan luku
def read_bsdata():
    """{nimi: [variantti, ...]} ja {normalisoitu valinta: {hinnat}}."""
    ships, picks = {}, collections.defaultdict(set)
    for path in sorted(glob.glob(os.path.join(CACHE, "*.cat")) +
                       glob.glob(os.path.join(CACHE, "*.gst"))):
        root = ET.parse(path).getroot()
        for e in walk(root):
            if tag(e) not in ("selectionEntry", "sharedSelectionEntry"):
                continue
            c = cost_of(e)
            pn = pick_key(e.get("name"))
            if pn and c is not None:
                picks[pn].add(c)

            unit, arms = None, []
            for p in own_profiles(e):
                tn = p.get("typeName") or ""
                if tn == "Unit" and unit is None:
                    unit = (p.get("name"), chars(p))
                elif tn == "Armament":
                    arms.append((p.get("name"), chars(p)))
            if unit and not arms:
                # valinnaiset aseet ovat usein lapsientryissa
                for ch in walk(e)[1:]:
                    if tag(ch) not in ("selectionEntry", "sharedSelectionEntry"):
                        continue
                    if any((p.get("typeName") or "") == "Unit"
                           for p in own_profiles(ch)):
                        continue                 # oma alus, ei taman ase
                    for p in own_profiles(ch):
                        if (p.get("typeName") or "") == "Armament":
                            arms.append((p.get("name"), chars(p)))
            if not unit:
                continue
            rec = dict(st=unit[1], pts=c, src=os.path.basename(path),
                       aw=[[clean(a[0]), a[1].get("Range/Speed", ""),
                            a[1].get("Firepower/Str", ""),
                            a[1].get("Fire Arc", "")] for a in arms])
            bucket = ships.setdefault(clean(unit[0]).lower(), [])
            twin = next((v for v in bucket
                         if v["st"] == rec["st"] and v["aw"] == rec["aw"]), None)
            if twin is None:
                bucket.append(rec)
            elif twin["pts"] is None:
                twin["pts"] = rec["pts"]
    return ships, picks


# ------------------------------------------------------------- normalisoinnit
STOP = {"class", "the", "of", "and", "a", "an", "ship", "vessel", "craft",
        "battleship", "cruiser", "escort", "destroyer", "frigate", "raider",
        "heavy", "light", "grand", "attack", "assault", "gunship", "ramship",
        "carrier", "transport", "star", "starship", "hulk", "rok", "kroozer",
        "battlekroozer", "battlecruiser", "monastery", "defence", "platform",
        "profile", "configuration"}


def name_key(n):
    # Sulkeissa oleva nimi on juuri se erotteleva osa, ei poistettavaa.
    # Heittomerkki poistetaan kokonaan: lahteissa on seka ' etta U+2019,
    # ja ilman tata "Or'es El'leath" ja "Or’Es El’Leath" olisivat
    # eri nimia.
    n = str(n or "").lower().replace("’", "").replace("'", "")
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    return frozenset(w for w in n.split() if len(w) > 2 and w not in STOP)


def pick_key(t):
    """Lisaoston nimi vertailukelpoiseksi: 'One extra re-roll' = 'One Re-roll'."""
    t = re.sub(r"\(.*?\)", " ", str(t or "").lower())
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\bextra\b|\badditional\b|\bthe\b", " ", t)
    t = re.sub(r"\bre rolls?\b|\brerolls\b", "reroll", t)
    return re.sub(r"\s+", " ", t).strip()


# Sama alus eri nimella. Jokainen pari on tarkistettu kasin vertaamalla
# koko tilastorivi; kaikissa naissa se tasmaa.
ALIAS = {
    "103": "seditio opprimere",
    "258": "scion",
    "260": "wage",
    "262": "terminus",
    "264": "slaverer",
    "329": "flame of asuryan",
    "383": "ork lite kroozer",
    "405": "necron cairn class tombship",
    "435": "tyranid kraken",
    "436": "tyranid vanguard drone ship",
    "491": "nicassar dhow",
    "492": "nicassar caravan",
    "493": "nicassar rig",
    "494": "kroot warsphere",
}

# Nimet jotka muistuttavat toisiaan mutta ovat ERI alus. Ilman tata ne
# tuottaisivat pelkkaa kohinaa.
NOT_SAME = {
    "104": "Space Marine Battle Barge != Chaos Battle Barge",
    "126": "Omnissiah's Victory on kirjan nimetty ainutlaatuinen alus, "
           "BSDatan 'Ark Mechanicus' saman luokan geneerinen profiili",
    "180": "Rogue Trader Cruiser != Rogue Trader Cargo Vessel",
    "192": "Armed Cargo Vessel != Cargo Transport (4/6 kenttaa samat, "
           "mutta nopeus ja kaantyminen eri - eri alus tai eri versio)",
    "476": "Il'Emaar (Courier) != Merchant (Il'Fannor)",
    "507": "Space Station != Haven Space Station",
}

NUM = re.compile(r"-?\d+")
NONE = {"none", "n/a", "-", "–", "—", ""}


def num(v):
    v = str(v or "").strip().lower()
    if v in NONE:
        return None
    m = NUM.search(v)
    return m.group(0) if m else None


def armour(v):
    # Sulkeissa oleva huomautus ("5+ (6+ Deflector)") ei ole panssariarvo.
    v = re.sub(r"\(.*?\)", " ", str(v or "").lower())
    got = re.findall(r"\d\+", v)
    return "/".join(sorted(set(got))) if got else None


FIELDS = [("hp", "Hits", num), ("sp", "Speed", num), ("tn", "Turns", num),
          ("sh", "Shields", num), ("ar", "Armour", armour),
          ("tu", "Turrets", num)]

POS = ["port", "starboard", "prow", "dorsal", "keel", "forward", "aft"]
FAMILY = [("nova", r"nova"), ("torpedo", r"torpedo|launcha"),
          ("launch", r"launch\s*bay"), ("lance", r"lance|phantom"),
          ("bombard", r"bombard"), ("battery", r"weapons?\s*batter|gunz|gun\b"),
          ("claw", r"claw|tentacle"), ("plasma", r"plasma|pyro|spine"),
          ("cannon", r"cannon"), ("missile", r"missile|railgun|ion")]


def weapon_key(name, ship_words):
    n = str(name or "").lower()
    for w in ship_words:
        n = re.sub(r"\b%s\b" % re.escape(w), " ", n)
    pos = next((p for p in POS if re.search(r"\b%s\b" % p, n)), "")
    fam = next((f for f, rx in FAMILY if re.search(rx, n)), "")
    return (pos, fam) if fam else None


# ------------------------------------------------------------------- vertailu
def main():
    if "--refresh" in sys.argv or not os.path.isdir(CACHE):
        print("BSData-tiedostot:")
        fetch("--refresh" in sys.argv)
        print()

    bs_ships, bs_picks = read_bsdata()
    mine = json.load(io.open(os.path.join(HERE, "bfg_data.json"),
                             encoding="utf-8"))

    index, label = collections.defaultdict(list), {}
    for nm, variants in bs_ships.items():
        k = name_key(nm)
        if k:
            index[k] += variants
            label.setdefault(k, nm)

    st = collections.Counter()
    diffs, pts_diff, arm_missing, arm_extra, partial, missing, rejected = \
        [], [], [], [], [], [], []

    for key, sh in sorted(mine["ships"].items(), key=lambda x: str(x[0])):
        alias = ALIAS.get(str(key))
        cands = bs_ships.get(alias) if alias else index.get(name_key(sh["nm"]))
        if not cands:
            if str(key) in NOT_SAME:
                rejected.append((sh["pg"], sh["nm"], NOT_SAME[str(key)]))
                continue
            k = name_key(sh["nm"])
            # Lyhyempi BSData-nimi kelpaa, jos siina on vahintaan kaksi
            # erottelevaa sanaa: "Explorer (Gal'leath)" vastaa omaa
            # konfiguraatioriviamme. Toiseen suuntaan ei hyvaksyta, koska
            # silloin ylimaarainen sana olisi BSDatan puolella ja voisi
            # tarkoittaa eri alusta ("Chaos Battle Barge").
            hit = [(bk, v) for bk, v in index.items()
                   if len(bk) >= 2 and bk <= k]
            if len(hit) == 1:
                cands = hit[0][1]
                st["short"] += 1
            else:
                loose = [(bk, v) for bk, v in index.items()
                         if bk and (bk <= k or k <= bk)]
                if len(loose) == 1:
                    partial.append((sh["pg"], sh["nm"], label.get(loose[0][0])))
                else:
                    missing.append(sh["nm"])
                continue
        st["ships"] += 1
        if alias:
            st["alias"] += 1

        for mk, bk, f in FIELDS:
            want = f(sh.get(mk))
            if want is None:
                continue
            theirs = {f(v["st"].get(bk)) for v in cands}
            theirs.discard(None)
            if not theirs:
                continue
            st["fields"] += 1
            if want in theirs:
                st["same"] += 1
            else:
                diffs.append((sh["pg"], sh["nm"], bk, sh.get(mk), sorted(theirs)))

        costs = {v["pts"] for v in cands if v["pts"] is not None}
        if costs and sh.get("bp") is not None:
            st["pts"] += 1
            if sh["bp"] in costs:
                st["pts_same"] += 1
            else:
                pts_diff.append((sh["pg"], sh["nm"], sh["bp"], sorted(costs)))

        words = [w for w in re.sub(r"[^a-z ]", " ", sh["nm"].lower()).split()
                 if len(w) > 2]
        per_variant = []
        for v in cands:
            got = {weapon_key(a[0], words) for a in v["aw"]}
            got.discard(None)
            if got:
                per_variant.append(got)
        ours = {weapon_key(a[0], words) for a in sh["aw"]}
        ours.discard(None)
        if per_variant and ours:
            union = set().union(*per_variant)
            # puuttuva rivi on merkittava vain jos se on KAIKISSA
            # varianteissa: yksittainen variantti on usein eri runko
            common = set.intersection(*per_variant)
            # Sijaintimaare puuttuu toisinaan toisesta lahteesta ("Railgun
            # Battery" vs "Port Railgun battery"). Silloin verrataan vain
            # asetyyppia, ettei nimeamistapa nayta puuttuvalta aseelta.
            our_fam = {f for _, f in ours}
            their_fam = {f for _, f in union}

            def covered(x, other, fams):
                return x in other or (not x[0] and x[1] in fams)

            arm_extra += [(sh["pg"], sh["nm"], x) for x in sorted(ours)
                          if not covered(x, union, their_fam)]
            arm_missing += [(sh["pg"], sh["nm"], x) for x in sorted(common)
                            if not covered(x, ours, our_fam)]

    # lisaostot ja komentajat
    up = collections.Counter()
    up_diff = []
    for L in mine["lists"]:
        for sec in L["secs"]:
            for e in sec["ents"]:
                if e.get("k") not in ("cmd", "up") or e.get("p") is None:
                    continue
                costs = bs_picks.get(pick_key(e["l"]))
                if not costs:
                    up["nohit"] += 1
                    continue
                up["checked"] += 1
                if e["p"] in costs:
                    up["same"] += 1
                else:
                    up_diff.append((L["nm"], sec["t"], e["l"], e["p"],
                                    sorted(costs), bool(e.get("prose"))))

    # ------------------------------------------------------------- raportti
    w = "=" * 84
    print(w)
    print("RISTIINTARKISTUS: oma data vs. BSData/battlefleetgothic")
    print(w)
    print("Aluksia vertailtu: %d / %d  (nimi sama %d, BSDatan lyhyempi nimi %d, "
          "kasin tarkistettu nimipari %d)"
          % (st["ships"], len(mine["ships"]),
             st["ships"] - st["alias"] - st["short"], st["short"], st["alias"]))
    print("Vertaamatta: eri alus %d, osittainen osuma %d, ei osumaa %d"
          % (len(rejected), len(partial), len(missing)))
    print("Tilastokenttia (Hits/Speed/Turns/Shields/Armour/Turrets): "
          "%d verrattu, SAMA %d (%.1f %%), eroaa %d"
          % (st["fields"], st["same"],
             100.0 * st["same"] / max(1, st["fields"]), len(diffs)))
    print("Alusten pistehinnat: %d verrattu, sama %d, eroaa %d"
          % (st["pts"], st["pts_same"], len(pts_diff)))
    print("Komentajat ja lisaostot: %d verrattu, sama %d (%.0f %%), eroaa %d "
          "(ei vastinetta %d)"
          % (up["checked"], up["same"],
             100.0 * up["same"] / max(1, up["checked"]), len(up_diff),
             up["nohit"]))

    def block(title, rows, fmt):
        print()
        print(w)
        print("%s  (%d)" % (title, len(rows)))
        print(w)
        for r in rows:
            print("  " + fmt(r))

    block("1) TILASTOEROT - katso nama kasin lahde-PDF:sta", diffs,
          lambda r: "s.%-5s %-34s %-8s oma %-12s BSData %s"
          % (r[0], r[1].title()[:34], r[2], repr(r[3])[:12],
             "/".join(map(str, r[4]))))
    block("2) ASERIVI PUUTTUU MEILTA (kaikissa BSDatan varianteissa on)",
          arm_missing,
          lambda r: "s.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], " ".join(x for x in r[2] if x)))
    block("3) ASERIVI VAIN MEILLA (Remastered-lisays tai vaihto-optio)",
          arm_extra,
          lambda r: "s.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], " ".join(x for x in r[2] if x)))
    block("4) ALUKSEN PISTE-EROT (eri saantoversio)", pts_diff,
          lambda r: "s.%-5s %-36s oma %-6s BSData %s"
          % (r[0], r[1].title()[:36], r[2], "/".join(map(str, r[3]))))

    seen, uniq = set(), []
    for r in up_diff:
        k = (pick_key(r[2]), r[3], tuple(r[4]))
        if k not in seen:
            seen.add(k)
            uniq.append(r)
    block("5) LISAOSTOJEN PISTE-EROT (eri saantoversio)", uniq,
          lambda r: "%-26s %-22s %-26s oma %-5s BSData %-11s%s"
          % (r[0][:26], r[1][:22], r[2][:26], r[3],
             "/".join(map(str, r[4]))[:11], "  <- proosasta" if r[5] else ""))
    block("6a) SAMANKALTAINEN NIMI, ERI ALUS - jatetty vertaamatta tahallaan",
          rejected, lambda r: "s.%-5s %-34s %s"
          % (r[0], r[1].title()[:34], r[2]))
    block("6b) OSITTAINEN NIMIOSUMA - ei vertailtu", partial,
          lambda r: "s.%-5s %-36s ~ %s"
          % (r[0], r[1].title()[:36], (r[2] or "").title()))
    block("7) BSDATA EI TUNNE - Remastered-kirjan omia tai eri nimisia",
          [(n,) for n in missing], lambda r: r[0].title())

    print()
    print("Muistutus: erot eivat ole virheita. BSData on eri saantoversio; "
          "lahde on aina PDF.")


if __name__ == "__main__":
    main()
