# -*- coding: utf-8 -*-
"""Lupaako listapaivitys jotain, mita kortti ei tee?

audit_effects.py tarkistaa aluksen omat optiot. Listojen yhteiset
paivitysrivit (Gubbins, klaanit, Bakkan torni, Tyranidien bio-paivitykset,
Daemonshipit...) jaivat sen ulkopuolelle: Codex-katselmointi 10.9.2026
loysi Extra Power Fieldsin, joka maksoi 25 pistetta mutta ei nostanut
kilpia. Tama tyokalu sulkee sen aukon samalla tavalla.

Jokainen aluksen kortille tarjottu listapaivitysrivi luokitellaan kirjasta
kasin tiedostossa referenssi/paivitykset.json:
    stat    rivilla on mod tai set (statsirivi muuttuu)
    weapon  rivilla on swp, add, del tai sw (aserivi muuttuu)
    text    kortin paivitysruutu kertoo saannon: kirjan osion oma lause,
            rivin desc tai domain.js:n up-avaimella sidottu saanto
    fleet   laivastotason osto ilman aluskohtaista vaikutusta
Rivit, joiden kohde on komentaja (at -> komentajarivi), ja rivit, jotka
aluksen oma optio kattaa jokaisella kohdealuksella, jatetaan pois: ne
tulostuvat komentajakortille tai eivat ole tarjolla.

Aja:  python audit_upgrades.py          yhteenveto + avoimet
      python audit_upgrades.py -v       jokainen rivi
      python audit_upgrades.py --json   koneluettava (acceptance.py)
Palauttaa 1, jos avoimia on.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))
REF = json.load(io.open(os.path.join(HERE, "referenssi", "paivitykset.json"), encoding="utf-8"))
DOMAIN = io.open(os.path.join(HERE, "domain.js"), encoding="utf-8").read()
VERBOSE = "-v" in sys.argv
AS_JSON = "--json" in sys.argv

EFF_STAT = ("mod", "set")
EFF_WEAPON = ("swp", "add", "del", "sw")

# domain.js:n saannot, jotka tulostuvat kun paivitys on otettu (up-avain).
UP_RULES = [re.compile(m.group(1), re.I if "i" in m.group(2) else 0)
            for m in re.finditer(r"\bup:/((?:[^/\\]|\\.)+)/([a-z]*)", DOMAIN)]


def tokens(t):
    return [w for w in re.sub(r"[^a-z0-9 ]", " ", str(t or "").lower()).split() if len(w) > 2]


def covers(o, en):
    """Sama saanto kuin domain.js optionCoversRow."""
    if o.get("cov") and re.search(o["cov"], str(en.get("l") or ""), re.I):
        return o.get("c") == en.get("p")
    want = tokens(en.get("l"))
    if not want:
        return False
    have = tokens(o.get("t"))
    if not all(w in have for w in want):
        return False
    return True if en.get("per") else o.get("c") == en.get("p")


def owned_text(sec, label):
    own = sec.get("own") or []
    return [t for i, t in enumerate(sec.get("text") or []) if i < len(own) and own[i] == label]


def classify(list_name, label):
    for c in REF["classes"]:
        if c.get("list") and not re.search(c["list"], list_name):
            continue
        if re.search(c["match"], label, re.I):
            return c
    return None


rows, skipped_cmd, skipped_cov = [], 0, 0
for L in D["lists"]:
    ship_ents = [e for s in L["secs"] for e in s.get("ents", []) if e.get("r")]
    for si, sec in enumerate(L["secs"]):
        for e in sec.get("ents", []):
            if e.get("k") != "up":
                continue
            targets = None
            if e.get("at"):
                targets = [L["secs"][a]["ents"][b] for a, b in e["at"]]
                if all(not t.get("r") for t in targets):
                    skipped_cmd += 1               # komentajan paivitys
                    continue
                targets = [t for t in targets if t.get("r")]
            else:
                targets = ship_ents
            ships = [D["ships"].get(str(t["r"])) for t in targets]
            ships = [s for s in ships if s]
            if ships and all(any(covers(o, e) for o in (s.get("ol") or [])) for s in ships):
                skipped_cov += 1                   # oma optio kattaa kaikkialla
                continue
            lab = str(e["l"])
            has_stat = any(e.get(k) for k in EFF_STAT)
            has_weapon = any(e.get(k) for k in EFF_WEAPON)
            has_text = bool(owned_text(sec, lab) or e.get("desc")
                            or any(rx.search(lab) for rx in UP_RULES))
            c = classify(L["nm"], lab)
            if not c:
                status = "luokittelematon"
            elif c["class"] == "stat" and not has_stat:
                status = "statsivaikutus puuttuu"
            elif c["class"] == "weapon" and not has_weapon:
                status = "asevaikutus puuttuu"
            elif c["class"] == "text" and not has_text:
                status = "saantoteksti puuttuu kortilta"
            else:
                status = "ok"
            rows.append(dict(list=L["nm"], sec=sec["t"], label=lab, cls=c["class"] if c else None,
                             page=c.get("page") if c else None, status=status))

open_rows = [r for r in rows if r["status"] != "ok"]
if AS_JSON:
    print(json.dumps(dict(rows=len(rows), open=len(open_rows),
                          unclassified=sum(1 for r in open_rows if r["status"] == "luokittelematon"),
                          commander=skipped_cmd, covered=skipped_cov), ensure_ascii=False))
    sys.exit(1 if open_rows else 0)

print("Listapaivitysrivit aluksen kortilla: %d (komentajan kautta %d, oman option kattamia %d)"
      % (len(rows), skipped_cmd, skipped_cov))
kinds = {}
for r in rows:
    kinds[r["cls"]] = kinds.get(r["cls"], 0) + 1
for k in sorted(kinds, key=str):
    print("  %-8s %d" % (k, kinds[k]))
print("avoimia: %d" % len(open_rows))
seen = set()
for r in (rows if VERBOSE else open_rows):
    key = (r["label"], r["status"])
    if not VERBOSE and key in seen:
        continue
    seen.add(key)
    print("  %-30s | %-26s | %-8s | s.%-4s | %s" % (r["status"], r["label"][:26], r["cls"] or "-",
                                                     r["page"] or "-", r["list"][:30]))
sys.exit(1 if open_rows else 0)
