# -*- coding: utf-8 -*-
"""Tuottaa SAANTOAUDIT.md: kirjan koostumussaannot vs. appin tarkistukset.

Dokumentti on toistettava: aja uudestaan kun kirja tai jasennin muuttuu,
niin luvut ja listat paivittyvat eivatka vanhene hiljaa.

Aja tassa kansiossa:  python saantoaudit.py
"""
import io
import json
import os
import re
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "SAANTOAUDIT.md")

d = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))

# Lause joka nayttaa koostumussaannolta. Sama kaava kuin haravoinnissa.
PAT = re.compile(r"(?i)(may include|no more than|for every|up to (one|two|three)|"
                 r"may not exceed|must outnumber|per [\d,]+ points|"
                 r"may only (include|take)|^\s*\d\s*[-–]\s*\d|must include|"
                 r"cannot include|maximum of)")
# Kampanja- ja pelinaikaiset lauseet eivat ole laivastonrakennusta.
SKIP = re.compile(r"(?i)(next game|campaign|roll|scenario|victory point|"
                  r"re-roll for|in your next|table\b)")

# Miksi lause jai valvomatta. Jarjestys ratkaisee: ensimmainen osuma voittaa.
REASONS = [
    (re.compile(r"(?i)must outnumber|may not exceed"),
     "vertailu kahden rungon valilla; moottorissa ei ole tata saantotyyppia"),
    (re.compile(r"(?i)per [\d,]+ points|for every [\d,]+ points|"
                r"points or (part|portion) thereof"),
     "pisterajaan sidottu, mutta kohteena alusluokka eika osio"),
    (re.compile(r"(?i)for every (\w+ )?(hive ship|cruiser-class|"
                r"capital ship|escort|Scythe|Merchant|Explorer)"),
     "suhdeluku alusluokkaan, ei osioon"),
    (re.compile(r"(?i)^you may include \d+ (admiral|pirate prince|"
                r"master of the fleet|mechanicus archmagos|dread archon|"
                r"or more warlord)"),
     "komentajan maara; jo valvottu osiorajana (0-1)"),
    (re.compile(r"(?i)any number of"),
     "ei rajoita mitaan"),
    (re.compile(r"(?i)mark of|terminators|imperative|siren|ark of|"
                r"veil of|daemonic entities"),
     "varuste- tai merkkivalinta, ei laivaston koostumus"),
    (re.compile(r"(?i)^(so if|for example|fleets of at least)"),
     "edellisen lauseen esimerkki"),
]


def reason(t):
    for rx, why in REASONS:
        if rx.search(t):
            return why
    return "lause ei jasenny nykyisilla kaavoilla"


rows, tot_r, tot_t = [], 0, 0
by_reason = {}
for L in d["lists"]:
    rules = [r for s in L["secs"] for r in s["rules"]]
    left = []
    for s in L["secs"]:
        for t in s["text"]:
            if PAT.search(t) and not SKIP.search(t) and len(t) < 230:
                left.append((s["t"], t, reason(t)))
                by_reason[left[-1][2]] = by_reason.get(left[-1][2], 0) + 1
    tot_r += len(rules)
    tot_t += len(left)
    kinds = {}
    for r in rules:
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    rows.append((L, rules, kinds, left))

o = []
o.append("# Saantoauditointi")
o.append("")
o.append("Kirjan koostumussaannot verrattuna siihen mita sovellus valvoo.")
o.append("Tuotettu `saantoaudit.py`:lla %s. Lahde: %s" % (date.today(), d["src"]))
o.append("")
o.append("## Yhteenveto")
o.append("")
o.append("| | |")
o.append("|---|---|")
o.append("| laivastolistoja | %d |" % len(d["lists"]))
o.append("| koneellisesti valvottuja saantoja | **%d** |" % tot_r)
o.append("| koostumuslauseita jotka jaavat pelaajan tarkistettaviksi | %d |" % tot_t)
o.append("| alusprofiileja | %d |" % len(d["ships"]))
o.append("| valittavia listarivaja | %d |"
         % sum(len(s["ents"]) for L in d["lists"] for s in L["secs"]))
o.append("")
o.append("Valvomatta jaavien syyt:")
o.append("")
o.append("| syy | lauseita |")
o.append("|---|---|")
for why, n in sorted(by_reason.items(), key=lambda x: -x[1]):
    o.append("| %s | %d |" % (why, n))
o.append("")
o.append("## Listakohtaisesti")
o.append("")
for L, rules, kinds, left in rows:
    o.append("### %s (kirjan sivu %s)" % (L["nm"], L["pg"]))
    o.append("")
    o.append("Valvottuja **%d** (%s). Tarkistettavaksi jaa %d."
             % (len(rules),
                ", ".join("%s %d" % (k, v) for k, v in sorted(kinds.items()))
                or "ei yhtaan",
                len(left)))
    o.append("")
    if rules:
        o.append("| tyyppi | valvottu saanto |")
        o.append("|---|---|")
        for r in rules:
            o.append("| `%s` | %s |" % (r["kind"], r.get("src", "").replace("|", "\\|")[:150]))
        o.append("")
    if left:
        o.append("| osio | lause jota ei valvota | syy |")
        o.append("|---|---|---|")
        for sec, t, why in left:
            o.append("| %s | %s | %s |"
                     % (sec[:24], t.replace("|", "\\|")[:150], why))
        o.append("")

io.open(OUT, "w", encoding="utf-8").write("\n".join(o) + "\n")
print("%s  %.0f kB" % (OUT, os.path.getsize(OUT) / 1024))
print("valvottuja %d, tarkistettavaksi jaavia %d" % (tot_r, tot_t))
