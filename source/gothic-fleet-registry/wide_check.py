# -*- coding: utf-8 -*-
"""Laaja pistokoe yhdelle listariville (docs/PISTOKOE.md, "Laaja tarkastus").
Tyokalu vain tulostaa; vertailu kirjaan tehdaan kasin.
Ajaa spot_checkin oletuskokoonpanolla, jokaisella optiolla erikseen,
jokaisella tarjotulla listapaivityksella erikseen ja kaikki optiot otettuna,
ja tulostaa:
  1. oletus: pisteet, statsit, aserivit, tarjotut paivitykset (myos muut),
     saannot, vaurio
  2. jokainen optio yksin: mika muuttuu oletukseen nahden (pisteet, statsit,
     aserivit +/-, saannot +/-)
  3. jokainen tarjottu paivitys yksin (kohta 6): sama ero oletukseen ja
     paivityksen oma rivi kuvauksineen - muuttuuko profiili, aseistus tai
     saanto niin kuin paivityksen lause kirjassa sanoo
  4. kaikki otettuna: painettu korttiteksti sellaisenaan
Kaytto: python wide_check.py <siemen> [--no-card] [--no-ups]
        (siemen kuten spot_check.js --seed)
"""
import json, os, re, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def run(args):
    return subprocess.run(["node", "spot_check.js", "--no-book"] + args, capture_output=True,
                          text=True, encoding="utf-8", errors="replace").stdout


def parse(out):
    d = dict(hdr="", pts=None, mx=None, stats={}, weapons=[], options=[], ups=[], rules=[], dmg="", crit="", card="", lead="", rr="")
    sec = None
    for ln in out.splitlines():
        if ln.startswith("PISTOKOE"): d["hdr"] = ln[len("PISTOKOE"):].strip(); continue
        m = re.match(r"kind (\w+).*?points (\d+)\s+maxPoints (\d+)", ln)
        if m: d["kind"], d["pts"], d["mx"] = m.group(1), int(m.group(2)), int(m.group(3)); continue
        if ln.startswith("stats "):
            try: d["stats"] = json.loads(ln[6:])
            except Exception: pass
            continue
        if ln.startswith("leadership "):
            d["lead"] = ln; continue
        if ln.startswith("ASEET"): sec = "w"; continue
        if ln.startswith("OPTIOT"): sec = "o"; continue
        if ln.startswith("PAIVITYKSET"): sec = "u"; continue
        if ln.startswith("SAANNOT"): sec = "r"; continue
        if ln.startswith("VAURIO"): d["dmg"] = ln; sec = None; continue
        if ln.startswith("CRITICAL"): d["crit"] = ln; continue
        if ln.startswith("JASENET") or ln.startswith("ISSUES"): sec = None
        if ln.startswith("######## KORTIN TEKSTI"): sec = "c"; continue
        if ln.startswith("######## KIRJA"): sec = None; continue
        if sec == "w" and ln.startswith("  ["): d["weapons"].append(re.sub(r"\s*\[object Object\](,\[object Object\])*", "", ln.strip()))
        elif sec == "o" and ln.startswith("  ["): d["options"].append(ln.strip())
        elif sec == "u" and ln.startswith("  ["): d["ups"].append(ln.strip())
        elif sec == "r" and ln.startswith("  - "): d["rules"].append(ln.strip()[2:])
        elif sec == "c": d["card"] += ln + "\n"
    return d


def diff(a, b):
    out = []
    if a["pts"] != b["pts"] or a["mx"] != b["mx"]: out.append("  pisteet %s/%s -> %s/%s" % (a["pts"], a["mx"], b["pts"], b["mx"]))
    for k in sorted(set(a["stats"]) | set(b["stats"])):
        if a["stats"].get(k) != b["stats"].get(k): out.append("  stats.%s %s -> %s" % (k, a["stats"].get(k), b["stats"].get(k)))
    wa, wb = set(a["weapons"]), set(b["weapons"])
    for w in [x for x in a["weapons"] if x not in wb]: out.append("  ase -  " + w)
    for w in [x for x in b["weapons"] if x not in wa]: out.append("  ase +  " + w)
    ra, rb = set(a["rules"]), set(b["rules"])
    for r in [x for x in a["rules"] if x not in rb]: out.append("  saanto -  " + r[:160])
    for r in [x for x in b["rules"] if x not in ra]: out.append("  saanto +  " + r[:160])
    if a["dmg"] != b["dmg"]: out.append("  vaurio: " + b["dmg"][:200])
    if a["lead"] != b["lead"]: out.append("  " + b["lead"][:200])
    # kohta 7 (pistokoe 11): paivitysketju - mika tulee tarjolle tai poistuu,
    # kun tama valinta on tehty (Daemonship -> Mark, miehisto -> Mark, Strand).
    ua, ub = up_labels(a), up_labels(b)
    for u in [x for x in ub if x not in ua]: out.append("  tarjonta +  " + u)
    for u in [x for x in ua if x not in ub]: out.append("  tarjonta -  " + u)
    return out or ["  (ei muutosta)"]


def up_labels(d):
    out = []
    for u in d["ups"]:
        m = UP_LINE.match(u)
        if m and m.group(2).strip() not in out:
            out.append(m.group(2).strip())
    return out


UP_LINE = re.compile(r"\[(\w+)\] (.*?)\s{2,}(-?\d+)")


def main():
    seed = sys.argv[1]
    base = parse(run(["--seed", seed]))
    print("################ OLETUS  " + base["hdr"])
    print("pisteet %s / max %s  stats %s" % (base["pts"], base["mx"], json.dumps(base["stats"], ensure_ascii=False)))
    if base["lead"]: print(base["lead"][:220])
    for w in base["weapons"]: print("  " + w)
    if base["options"]:
        print("OPTIOT:"); [print("  " + o[:230]) for o in base["options"]]
    if base["ups"]:
        print("PAIVITYKSET (oma/muu, tarjolla):"); [print("  " + u[:200]) for u in base["ups"]]
    print("SAANNOT:"); [print("  - " + r[:230]) for r in base["rules"]]
    print(base["dmg"][:230]); print(base["crit"][:160])
    idx = [int(m.group(1)) for o in base["options"] for m in [re.match(r"\[\w+\] (\d+)\.", o)] if m]
    for i in idx:
        one = parse(run(["--seed", seed, "--opt", str(i)]))
        print("################ OPTIO %d YKSIN" % i)
        for ln in diff(base, one): print(ln)
    if "--no-ups" not in sys.argv:
        for u in base["ups"]:
            m = UP_LINE.match(u)
            if not m or m.group(1) == "take":
                continue                         # pakollinen: jo oletuksessa
            lab = m.group(2).strip()
            # spot_check --up vertaa osamerkkijonona (kirjainkoko ei ratkaise)
            one_out = run(["--seed", seed, "--up", lab])
            one = parse(one_out)
            mine = [x for x in one["ups"] if x.startswith("[take] " + lab)]
            print("################ PAIVITYS YKSIN: %s" % lab)
            if mine: print("  rivi: " + mine[0][:230])
            else: print("  rivi: (ei otettu - tarkista)")
            for ln in diff(base, one): print(ln)
    allp = parse(run(["--seed", seed, "--all"]))
    print("################ KAIKKI OTETTUNA: muutos oletukseen")
    for ln in diff(base, allp): print(ln)
    if "--no-card" not in sys.argv:
        print("################ KORTIN TEKSTI (kaikki otettuna)")
        print(allp["card"].rstrip())


if __name__ == "__main__":
    main()
