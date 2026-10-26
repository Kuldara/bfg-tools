# -*- coding: utf-8 -*-
"""Tekee referenssi/check_yourself.json:n kasiluokituksesta (luokitus_kaikki.json).

Kasiluokitus (YHTEENVETO.md, 20.10.2026) kertoo jokaisesta osion lauseesta,
mihin ryhmaan se kuuluu. Referenssitiedosto on sen sovellukselle luettava
muoto: lause (normalisoituna avaimena), ryhma (g), perhe (f), sivu (p).
build_data.py liittaa ryhman jokaiseen osion lauseeseen (sec.cls), ja
kayttoliittyma jakaa lauseet sen mukaan.

Ryhmat:
  checked   builder valvoo (tai rakenne estaa rikkomisen)
  open      kirjan saanto, jota builder ei viela valvo -> "Not checked"
  info      laivaston tieto (attack rating, vastustajan edut) -> Fleet facts
  models    mallit ja maalaus
  play      pelin aikainen saanto -> In play
  campaign  kampanja ja skenaario
  row       rivin tai paivityksen kuvaus
  drop      kerronta, johdanto, esimerkki: ei naytetä katalogissa

Aja:  python docs/check-yourself/tee_referenssi.py
"""
import io, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
FB = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, "luokitus_kaikki.json")
OUT = os.path.join(FB, "referenssi", "check_yourself.json")

BY_CLASS = {"VALVOTTU": "checked", "RAKENNE": "checked", "OMINAISUUS": "open",
            "LASKETTAVA": "info", "PELI": "play", "KAMPANJA": "campaign",
            "TAUSTA": "drop"}
TARKISTA = {"squadron_tabletop": "open", "modelling": "models",
            "opponent_bonus": "info", "agreement": "open"}
# Poimintavikojen sisalto (YHTEENVETO.md, ROSKA): ryhma sen mukaan, mita
# lause sanoo. Lause itse korjataan erikseen (vaihe 1b).
ROSKA = {"S0114": "play", "S0171": "checked", "S0172": "checked", "S0185": "play",
         "S0209": "campaign", "S0229": "campaign", "S0299": "drop", "S0329": "row",
         "S0353": "drop", "S0417": "row", "S0529": "row", "S0541": "row",
         "S0655": "play", "S0715": "row", "S0810": "drop", "S0900": "drop",
         "S0902": "drop", "S0904": "drop", "S0906": "drop", "S0911": "drop",
         "S1032": "row", "S1060": "checked", "S1062": "open"}
# Lause, joka ei koske jotain listaa lainkaan. Incursion-listalla ei ole
# Daemonship-riveja (s.232-233), joten yleisen Chaos-luvun Daemonship-saannot
# ovat sille turhia. S0348 koskee vain Tau-, Demiurg- ja Imperial-laivastoja.
INCURSION_DAEMON = ["S%04d" % i for i in range(413, 449)]
NOT_LISTS = {i: ["Chaos — Incursion"] for i in INCURSION_DAEMON}
G_BY_LIST = {"S0348": {"Rogue Traders": "checked"}}


def key(t):
    t = (t or "").replace("’", "'").replace("‘", "'")
    t = t.replace("re- roll", "re-roll").replace("Re- roll", "Re-roll")
    return re.sub(r"[^a-z0-9']+", " ", t.lower()).strip()


def group(r):
    if r["id"] in ROSKA:
        return ROSKA[r["id"]]
    if r["l"] == "KUVAUS":
        return "row" if r["a"] == "row" else "drop"
    if r["l"] == "TARKISTA":
        return TARKISTA[r["f"]]
    return BY_CLASS[r["l"]]


def main():
    rows = json.load(io.open(SRC, encoding="utf-8"))
    out = []
    for r in rows:
        e = {"id": r["id"], "g": group(r), "f": r.get("f"),
             "p": int(r["p"][1:]) if r.get("p") else None, "text": r["text"]}
        if r["id"] in NOT_LISTS:
            e["drop_in"] = NOT_LISTS[r["id"]]
        if r["id"] in G_BY_LIST:
            e["g_by_list"] = G_BY_LIST[r["id"]]
        if r["id"] == "S0348":
            e["g"] = "drop"
        out.append(e)
    # Kaksi lausetta voi erota vain valimerkeilta ("etc." / "etc.."). Sama
    # ryhma -> yksi rivi riittaa; eri ryhma olisi ristiriita.
    keys, uniq = {}, []
    for e in out:
        k = key(e["text"])
        if k in keys:
            assert keys[k]["g"] == e["g"], "sama avain, eri ryhma: %s %s" % (keys[k]["id"], e["id"])
            keys[k].setdefault("also", []).append(e["id"])
            continue
        keys[k] = e
        uniq.append(e)
    out = uniq
    doc = {
        "_lue": ("Check yourself -lauseiden kasiluokitus (docs/check-yourself/YHTEENVETO.md, "
                 "20.10.2026). build_data.py liittaa ryhman jokaiseen osion lauseeseen "
                 "(sec.cls). Uusi lause ilman luokkaa naytetaan ryhmassa 'open', ja "
                 "check_reference.py raportoi sen."),
        "_ryhmat": {"checked": "builder valvoo tai rakenne estaa rikkomisen",
                    "open": "kirjan saanto, jota builder ei valvo (Not checked)",
                    "info": "laivaston tieto: attack rating, vastustajan edut",
                    "models": "mallit ja maalaus", "play": "pelin aikainen saanto",
                    "campaign": "kampanja ja skenaario", "row": "rivin tai paivityksen kuvaus",
                    "drop": "kerronta, johdanto, esimerkki - ei naytetä katalogissa"},
        "_avain": "text normalisoituna: pienet kirjaimet, heittomerkit suoriksi, muu kuin a-z0-9' valilyonniksi",
        "sentences": out,
    }
    tmp = OUT + ".tmp"
    io.open(tmp, "w", encoding="utf-8").write(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    os.replace(tmp, OUT)
    from collections import Counter
    print("lauseita", len(out), dict(Counter(e["g"] for e in out)))


if __name__ == "__main__":
    main()
