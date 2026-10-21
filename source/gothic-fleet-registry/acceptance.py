# -*- coding: utf-8 -*-
"""Yksi komento koko hyvaksynnalle.

    python acceptance.py

Ilman tata jokainen kehityskierros alkaa sen paattelemisella, mitka
komennot pitaa ajaa ja missa jarjestyksessa. Tama ajaa ne, mittaa
docs/DEFINITION_OF_DONE.md:n luvut, kertoo yhden tuomion ja kirjoittaa
docs/DEVELOPMENT_STATUS.md mitatuista luvuista - jolloin statusdokumentti
ei voi vanhentua, koska sita ei kirjoiteta kasin.

Tuomio on kolmiportainen, ei kaksiportainen:

    LAPI              jokainen DoD-mittari on nolla ja mitattu
    VAKAUTUS KESKEN   mikaan ei ole rikki, mutta tiedettya tyota on
                      jaljella tai jokin mittari on viela mittaamatta
    HYLATTY           jokin on rikki: tarkistin kaatui, tapaus jonka
                      pitaisi menna lapi ei mene, artefaktit eroavat,
                      build ei ole toistettava tai kuittaus on viallinen

Ero on olennainen: "vakautus kesken" on suunniteltu tila, "hylatty" ei.
Jalkimmaista ei saa vaientaa edelliseksi merkitsemalla tapaus aukoksi.

Build rakentaa myos sivustoversion ja tarkistaa, etta se vastaa
kehitysversiota: sovelluksen on oltava julkaisukelpoinen jokaisen vaiheen
jalkeen, ei vasta lopussa.

Valitsimet:
    --quick    ohita stress.js ja audit.py (hitaat, lukevat PDF:n)
    --no-doc   ala kirjoita docs/DEVELOPMENT_STATUS.md
"""
import subprocess, sys, os, io, json, time, re, glob

HERE = os.path.dirname(os.path.abspath(__file__))
QUICK = "--quick" in sys.argv
NO_DOC = "--no-doc" in sys.argv
ENV = dict(os.environ, PYTHONIOENCODING="utf-8")

# nimi, komento, hidas
STEPS = [
    ("BUILD DATA",      ["python", "build_data.py"],         False),
    ("OSIOVARTIJA",     ["python", "build_data.py", "--prove-guard"], False),
    ("BUILD HTML",      ["python", "build.py"],              False),
    # Pelin aikainen kannykkakortti (play/LUEMINUT.md): oma tiedosto, jonka
    # make_site.py kopioi sivustolle - siksi ennen BUILD SITEa.
    ("BUILD PELIKORTTI", ["python", "play/build_play.py"],   False),
    ("BUILD SITE",      ["python", "julkaisu/make_site.py"], False),
    ("PROFIILIT",       ["python", "check_profiles.py"],     True),
    ("AUDIT PDF",       ["python", "audit.py"],              True),
    ("RAKENNE",         ["node", "qa_structure.js"],         False),
    ("LISTASAANNOT",    ["python", "check_reference.py"],    False),
    ("OHJAUSMERKIT",   ["python", "check_control.py"],      False),
    ("SITAATIT",       ["python", "check_quotes.py"],       False),
    # Pistokoe 20 (14.9.2026) toi nelja uutta koneellista menetelmaa:
    # pelaajalle nakyva lause on kirjassa; goldenin lasku tasmaa odotukseen;
    # rikottu tallenne ei palauta vaaraa alusta hiljaa; reservibudjetti ei
    # riipu lahdelistasta.
    ("SIVUT",          ["python", "check_pages.py"],        False),
    ("LASKUT",         ["python", "check_golden_math.py"],  False),
    ("TALLENNEFUZZ",   ["node", "fuzz_save.js", "1000"],    False),
    ("SYMMETRIA",      ["node", "check_symmetry.js"],       False),
    ("HINNOITTELU",     ["python", "coverage.py"],           False),
    ("GOLDEN",          ["node", "test_golden.js"],          False),
    ("VALIDAATTORI",    ["node", "test_validator.js"],       False),
    ("PAIVITYKSET",     ["node", "test_upgrades.js"],        False),
    ("TALLENNUS",       ["node", "test_save.js"],            False),
    ("DOMAIN",          ["node", "test_domain.js"],          False),
    ("PELIKORTTI",      ["node", "play/test_play.js"],       False),
    ("KORTIT",          ["node", "print_check.js"],          False),
    # J226: Da Ork Clanzin rakentaminen Warlord-lohkolla oikeassa Chromessa
    # puhelimen koossa; lopputilan pitaa olla tehtavan laivasto (mittari/LUEMINUT.md).
    ("CLANZ-UI",        ["node", "mittari/clanz.js", "--tapa=selaus"], False),
    ("SATUNNAISAJO",    ["node", "stress.js"],               True),
    ("VAIKUTUSJONO",    ["python", "audit_effects.py"],      False),
    ("PAIVITYSVAIKUTUS", ["python", "audit_upgrades.py"],    False),
    ("TULOSTUS",        ["node", "layout_check.js", "--json"], False),
]
# Naiden punainen ei ole rikki vaan tiedettya tyota; GOLDEN ja VAIKUTUSJONO
# eritellaan alempana mittareiksi eika kirjata tassa.
DETAILED = {"GOLDEN", "VAIKUTUSJONO"}


def run(cmd):
    t0 = time.time()
    p = subprocess.run(cmd, cwd=HERE, env=ENV, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    return p.returncode, (p.stdout or "") + (p.stderr or ""), time.time() - t0


def json_of(cmd):
    code, out, _ = run(cmd)
    try:
        return json.loads(out[out.index("{"):])
    except Exception:
        return None


def read(p):
    return io.open(p, encoding="utf-8").read() if os.path.exists(p) else None


print("HYVAKSYNTA  Gothic Fleet Registry")
print("=" * 62)

broken = []
outputs = {}
data_path = os.path.join(HERE, "bfg_data.json")
data_before = read(data_path)

for name, cmd, slow in STEPS:
    if QUICK and slow:
        print("  %-16s %s" % (name, "OHITETTU (--quick)"))
        continue
    code, out, dt = run(cmd)
    outputs[name] = out
    ok = code == 0
    if name in DETAILED:
        tag = "LAPI" if ok else "TYOTA"
    else:
        tag = "LAPI" if ok else "HYLATTY"
    last = [l for l in out.strip().split("\n") if l.strip()]
    print("  %-16s %-8s %5.1fs  %s" % (name, tag, dt, (last[-1] if last else "")[:44]))
    if tag == "HYLATTY":
        broken.append((name, (last[-1] if last else "")[:70]))

# --- DoD-mittarit -----------------------------------------------------------
m = {}

# toistettavuus
repro = True
if data_before is not None:
    repro = read(data_path) == data_before
m["build_reproducible"] = "kylla" if repro else "EI"
if not repro:
    broken.append(("TOISTETTAVUUS", "bfg_data.json muuttui buildissa - ei ollut ajan tasalla"))

# golden
g = json_of(["node", "test_golden.js", "--json"]) or {}
m["golden_failures"] = g.get("fail", 0)
m["golden_gaps"] = g.get("gap_open", 0)
# laivastotaso (1.1 vaihe 1): sama ajuri, oma tapaustiedosto
m["fleet_golden_failures"] = g.get("fleet_fail", 0)
m["fleet_golden_gaps"] = g.get("fleet_gap_open", 0)
m["surface_disagreements"] = g.get("surface_disagreements", 0)
m["save_roundtrip_failures"] = sum(
    1 for c in g.get("cases", []) if any("tallennuskierros" in s for s in c.get("surfaces", [])))
if g.get("fail"):
    ids = [c["id"] for c in g.get("cases", []) if c.get("status") != "gap"
           and (c.get("points") or c.get("profile") or c.get("surfaces"))]
    broken.append(("GOLDEN", "epaonnistui: " + ", ".join(ids)[:60]))
if g.get("fleet_fail"):
    ids = [c["id"] for c in g.get("fleet_cases", []) if c.get("status") != "gap"
           and (c.get("total") or c.get("errors") or c.get("checks"))]
    broken.append(("GOLDEN-LAIVASTO", "epaonnistui: " + ", ".join(ids)[:60]))

# osioviittaukset (1.1 vaihe 1): jokaisen on kannettava osionsa nimi
_REF_LIST_KEYS = ("sec", "allow_sec", "per_sec")


def _refs_walk(node, acc):
    if isinstance(node, list):
        for x in node:
            _refs_walk(x, acc)
        return
    if not isinstance(node, dict):
        return
    for k, v in node.items():
        if k in _REF_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            acc[0] += len(v)
            if isinstance(node.get(k + "_sn"), list) and len(node[k + "_sn"]) == len(v):
                acc[1] += len(v)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            acc[0] += 1
            if node.get("sn" if k == "sec" else "up_sn") is not None:
                acc[1] += 1
        elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
            _refs_walk(v, acc)


_refs = [0, 0]
for _L in json.load(io.open(data_path, encoding="utf-8"))["lists"]:
    for _s in _L["secs"]:
        for _r in _s.get("rules") or []:
            _refs_walk(_r, _refs)
m["index_refs_unnamed"] = _refs[0] - _refs[1]
index_refs_total = _refs[0]

# vaikutusjono
e = json_of(["python", "audit_effects.py", "--json"]) or {}
m["effect_queue_open"] = e.get("queue_open", 0)
m["invalid_acks"] = e.get("invalid_acks", 0)
# listapaivitysten vaikutukset (tyojono J1, Codex 10.9.2026)
u = json_of(["python", "audit_upgrades.py", "--json"]) or {}
m["upgrade_effect_open"] = u.get("open", 0)
if m["invalid_acks"]:
    broken.append(("KUITTAUKSET", "%d viallista rivia referenssi/optiot.json:ssa" % m["invalid_acks"]))

# luokittelemattomat listasaannot
st = {"enforced": 0, "manual": 0, "gap": 0, "not_shown": 0, "out_of_scope": 0}
# Kirjan yleisluvut (scope: general: Fleets s.14-17 reservit, s.496-517
# planetary defences) lasketaan erikseen: ne eivat
# ole laivastolistoja, ja niiden aukot ovat oma tyojononsa eivatka 1.0:n mittari.
gst = dict.fromkeys(st, 0)
nrules = nlists = ngeneral = 0
for f in sorted(glob.glob(os.path.join(HERE, "referenssi", "[0-9][0-9]_*.json"))):
    _ref = json.load(io.open(f, encoding="utf-8"))
    _general = _ref.get("scope") == "general"
    if not _general:
        nlists += 1
    for r in _ref.get("rules", []):
        _st = r.get("status", "manual")
        if _general:
            ngeneral += 1
            gst[_st] = gst.get(_st, 0) + 1
        else:
            nrules += 1
            st[_st] = st.get(_st, 0) + 1
m["unclassified_rules"] = st["gap"] + st["not_shown"]
m["general_rules_open"] = gst["gap"] + gst["not_shown"]

# avoimet P1-tehtavat
open_tasks = []
for f in sorted(glob.glob(os.path.join(HERE, "tasks", "P1-*.md"))):
    t = read(f) or ""
    mm = re.search(r"\*\*Tila:\*\*\s*([^·\n]*)", t)
    tila = (mm.group(1) if mm else "").strip().lower()
    if "valmis" not in tila:
        open_tasks.append(os.path.basename(f))
m["open_tasks_p1"] = len(open_tasks)

# artefaktit: sivustoversion skripti + data = kehitysversion
root_html = read(os.path.join(HERE, "Gothic Fleet Registry.html"))
site_html = read(os.path.join(HERE, "julkaisu", "site", "index.html"))
tail = lambda h: h[h.find("<script"):] if h and "<script" in h else h
if root_html is None or site_html is None:
    m["artifact_mismatches"] = 1
    broken.append(("ARTEFAKTIT", "kehitys- tai sivustoversio puuttuu"))
elif tail(root_html) != tail(site_html):
    m["artifact_mismatches"] = 1
    broken.append(("ARTEFAKTIT", "julkaisu/site/index.html ei ole samasta buildista"))
else:
    m["artifact_mismatches"] = 0

# jakelupaketti: VAIN LUKU tassa. build.py pakkaa sen jokaisen buildin
# lopuksi (12.10.2026, julkaisu/make_share_zip.py), joten taman pitaisi olla
# aina "kylla"; "EI" tarkoittaa, etta juuren HTML on tehty muuten kuin
# build.py:lla tai pakettia on muokattu kasin. Paketin HTML:sta puuttuu
# Play-nappi, joka on rungossa ennen skriptia - vertailu (tail) ei nae sita.
zip_path = os.path.join(HERE, "share version", "Gothic Fleet Registry.zip")
try:
    import zipfile
    with zipfile.ZipFile(zip_path) as z:
        names = [n for n in z.namelist() if n.lower().endswith(".html")]
        zh = z.read(names[0]).decode("utf-8", "replace") if names else ""
    m["share_zip_current"] = "kylla" if (root_html and tail(zh) == tail(root_html)) else "EI - pakkaa uudelleen"
except Exception:
    m["share_zip_current"] = "puuttuu"

# tulostus: layout_check.js sovittaa jokaisen listarivin kortin (oletus ja
# kaikki valinnat) headless-Chromessa sovelluksen omalla fitCards():lla ja
# mittaa ylivuodot ja alle 4.2 pt:n painuneen tekstin (DoD 5). Jos ajo ei
# tuottanut raporttia (selain puuttuu), mittari on "ei mitattu" - ei nolla.
try:
    _lo = outputs.get("TULOSTUS", "")
    lay = json.loads(_lo[_lo.index("{"):])
except Exception:
    lay = None
if lay and "print_overflows" in lay:
    m["print_overflows"] = lay["print_overflows"]
    m["unreadable_print_cases"] = lay["unreadable_print_cases"]
    m["print_floor_pt"] = lay.get("floor_pt")
    m["print_min_pt"] = lay.get("min_pt")
else:
    m["print_overflows"] = "ei mitattu"
    m["unreadable_print_cases"] = "ei mitattu"

# --- raportti ---------------------------------------------------------------
D = json.load(io.open(data_path, encoding="utf-8"))
print("=" * 62)
print("DEFINITION OF DONE  (docs/DEFINITION_OF_DONE.md)")
order = ["golden_failures", "golden_gaps",
         "fleet_golden_failures", "fleet_golden_gaps", "surface_disagreements",
         "save_roundtrip_failures", "effect_queue_open", "invalid_acks",
         "upgrade_effect_open", "unclassified_rules", "general_rules_open",
         "index_refs_unnamed",
         "open_tasks_p1", "artifact_mismatches",
         "build_reproducible", "share_zip_current",
         "print_overflows", "unreadable_print_cases"]
for k in order:
    v = m[k]
    flag = ("" if v in (0, "kylla") else ("  <- ei mitattu" if v == "ei mitattu" else "  <-"))
    print("  %-26s %s%s" % (k, v, flag))
print("  aluksia %d  listoja %d  saantoja %d  optioita %d  golden %d (+%d laivastoa)"
      % (len(D["ships"]), nlists, nrules, e.get("total", 0), g.get("total", 0),
         g.get("fleet_total", 0)))
if m.get("print_min_pt") is not None:
    print("  tulostus: pienin teksti %s pt, raja %s pt (%s korttia)"
          % (m["print_min_pt"], m["print_floor_pt"], lay.get("cards")))

work_left = (m["golden_gaps"] or m["fleet_golden_gaps"] or m["general_rules_open"]
             or m["effect_queue_open"] or m["unclassified_rules"]
             or m["open_tasks_p1"] or "ei mitattu" in m.values()
             or m["share_zip_current"] != "kylla")
print("=" * 62)
if broken:
    verdict = "HYLATTY"
    print("TUOMIO: HYLATTY")
    for name, why in broken:
        print("   %-14s %s" % (name, why))
elif work_left:
    verdict = "VAKAUTUS KESKEN"
    print("TUOMIO: VAKAUTUS KESKEN")
    for t in open_tasks:
        print("   avoin: tasks/" + t)
    print("   seuraava: docs/BACKLOG.md")
else:
    verdict = "LAPI"
    print("TUOMIO: LAPI")

# --- statusdokumentti mittauksista ----------------------------------------
if not NO_DOC:
    doc = os.path.join(HERE, "docs", "DEVELOPMENT_STATUS.md")
    os.makedirs(os.path.dirname(doc), exist_ok=True)
    rows = "\n".join("| `%s` | %s |" % (k, m[k]) for k in order)
    io.open(doc, "w", encoding="utf-8").write(u"""# Kehitystila

**Tämä tiedosto on generoitu.** Sen kirjoittaa `python acceptance.py`
mittauksista, eikä sitä muokata käsin — käsin kirjoitettu statusdokumentti
vanhenee ensimmäisellä muutoksella ja johtaa seuraavan lukijan harhaan.

Mitattu: %s

## Tuomio

    %s

## Definition of Done -mittarit

Ehdot: `docs/DEFINITION_OF_DONE.md`. `LAPI` vaatii jokaiselta riviltä
nollan tai "kyllä", ja "ei mitattu" on muutettava mitatuksi.

| mittari | nyt |
|---|---|
%s

## Kattavuus

| akseli | nyt | mistä |
|---|---|---|
| Laivastolistoja | %d | `referenssi/NN_*.json` |
| Alusprofiileja | %d | `bfg_data.json` |
| Sääntöjä referensseissä | %d | `check_reference.py` |
| — `enforced` | %d | moottori valvoo |
| — `manual` | %d | näytetään pelaajalle |
| — `gap` | %d | pitäisi valvoa, ei valvota |
| — `not_shown` | %d | päätös tekemättä |
| — `out_of_scope` | %d | perustellusti rajattu ulos |
| Valvonta-aste | %.0f %% | enforced / (enforced + gap) |
| Aluksen optioita | %d | `audit_effects.py` |
| — rakenteinen vaikutus | %d | |
| — tarkistusjonossa | %d | |
| Golden-tapauksia | %d | `referenssi/golden_cases.json` |
| Laivastotason golden-tapauksia | %d | `referenssi/golden_fleet_cases.json` |
| Osioviittauksia (kaikki nimettyja) | %d | `build_data.py --prove-guard` |
| Kirjan yleislukujen saantoja (Fleets s.14-17, s.496-517) | %d | `referenssi/99_yleiset_reservit.json`, `98_planetary_defences.json` |
| - niista viela valvomatta | %d | 1.1 vaihe 3 |

## Avoimet tehtävät

%s

## Miten tämä päivitetään

    python acceptance.py

Älä muokkaa tätä tiedostoa. Jos luku on väärin, korjaa mittaus.
""" % (time.strftime("%Y-%m-%d %H:%M"), verdict, rows,
       nlists, len(D["ships"]), nrules, st["enforced"], st["manual"], st["gap"],
       st["not_shown"], st["out_of_scope"],
       100.0 * st["enforced"] / max(st["enforced"] + st["gap"], 1),
       e.get("total", 0), e.get("modelled", 0), e.get("queue_open", 0),
       g.get("total", 0), g.get("fleet_total", 0), index_refs_total,
       ngeneral, m["general_rules_open"],
       "\n".join("- `tasks/%s`" % t for t in open_tasks) or "- ei avoimia"))
    print("\nkirjoitettu docs/DEVELOPMENT_STATUS.md")

sys.exit(1 if broken else 0)
