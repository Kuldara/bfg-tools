# -*- coding: utf-8 -*-
"""Vertaa kasin luettuja referensseja generoituun bfg_data.json:iin.

Referenssit ovat kansiossa referenssi/, yksi tiedosto per laivastolista.
Ne on luettu kirjasta kasin; tama skripti tarkistaa etta sovellus yha
vastaa niita. Katso referenssi/LUEMINUT.md.

Paluuarvo on 1 jos loydoksia on, joten taman voi liittaa julkaisuputkeen.

Aja tassa kansiossa:  python check_reference.py
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REFDIR = os.path.join(HERE, "referenssi")


def norm(s):
    """Vertailumuoto: pienet kirjaimet, valimerkit ja valilyonnit pois.

    Kirjan viiva voi olla - tai en dash, ja poiminta pudottaa pisteita,
    joten tasmallinen merkkijonovertailu antaisi vaaria loydoksia."""
    s = (s or "").lower()
    s = s.replace("–", "-").replace("—", "-").replace("’", "'")
    return re.sub(r"[^a-z0-9]+", "", s)


def load_refs():
    if not os.path.isdir(REFDIR):
        return []
    out = []
    for fn in sorted(os.listdir(REFDIR)):
        # Vain listareferenssit NN_nimi.json. Kansiossa on myos muuta
        # kasin luettua totuutta (golden_cases.json, optiot.json), jolla on
        # oma skeema ja oma tarkistimensa.
        if not re.match(r"\d\d_.*\.json$", fn):
            continue
        p = os.path.join(REFDIR, fn)
        out.append((fn, json.load(io.open(p, encoding="utf-8"))))
    return out


def find_list(data, name):
    for L in data["lists"]:
        if L["nm"] == name:
            return L
    return None


def rule_params_ok(ref, r, out, where):
    """Vertaa referenssin odottamat parametrit loytyneeseen saantoon."""
    k = ref.get("kind")
    if k and r["kind"] != k:
        out.append("%s: tyyppi on %r, referenssi odottaa %r"
                   % (where, r["kind"], k))
        return
    if k == "section_count":
        for f in ("min", "max"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s on %r, referenssi odottaa %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "squadron":
        for f in ("min", "max"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s on %r, referenssi odottaa %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "ratio":
        for f in ("allow", "per"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s on %r, referenssi odottaa %r"
                           % (where, f, r.get(f), ref[f]))
        want = ref.get("per_types")
        if want:
            got = [x.strip() for x in re.split(r"\s+or\s+",
                                               r.get("per_type", "")) if x.strip()]
            if len(got) != len(want):
                out.append("%s: nimittaja kattaa %d tyyppia (%s), "
                           "referenssi odottaa %d (%s)"
                           % (where, len(got), ", ".join(got) or "-",
                              len(want), ", ".join(want)))
    elif k == "cap":
        if "max" in ref and r.get("max") != ref["max"]:
            out.append("%s: max on %r, referenssi odottaa %r"
                       % (where, r.get("max"), ref["max"]))
    elif k == "per_points":
        for f in ("each", "per"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s on %r, referenssi odottaa %r"
                           % (where, f, r.get(f), ref[f]))
    elif k in ("allowed_at", "conditional_cap", "requires", "min_ratio", "compare",
               "points_share", "tiers", "upgrade_ratio", "unit_upgrade_max"):
        # Kohta 8: uudet saantotyypit. Referenssi voi nimeta parametrit,
        # jotka sen on vastattava datassa.
        for f in ("points", "basis", "op", "min", "max", "pct", "frac", "per", "allow",
                  "cond_min", "max_met", "max_unmet", "a_mult", "of"):
            if f in ref and r.get(f) != ref[f]:
                out.append("%s: %s on %r, referenssi odottaa %r"
                           % (where, f, r.get(f), ref[f]))
    elif k == "mandatory_at":
        if "points" in ref and r.get("points") != ref["points"]:
            out.append("%s: points on %r, referenssi odottaa %r"
                       % (where, r.get("points"), ref["points"]))
        # "over 750" ja "750 or more" eroavat tasan 750:n kohdalla.
        if "over" in ref and bool(r.get("over")) != bool(ref["over"]):
            out.append("%s: vertailu on %s, referenssi odottaa %s"
                       % (where, "yli" if r.get("over") else "vahintaan",
                          "yli" if ref["over"] else "vahintaan"))



_FLEET_IDS = []


def fleet_case_ids():
    """Laivastotason golden-tapausten tunnisteet (luetaan kerran)."""
    if not _FLEET_IDS:
        fp = os.path.join(REFDIR, "golden_fleet_cases.json")
        if os.path.exists(fp):
            _FLEET_IDS.extend(c["id"] for c in json.load(
                io.open(fp, encoding="utf-8")).get("cases", []))
    return _FLEET_IDS


def check_general(ref, data, out):
    """Kirjan yleisluku (scope: general): saannot, jotka eivat kuulu yhteen
    listaan vaan kaikkiin. Tiedostolla ei ole list-kenttaa, joten valvonta
    etsitaan kaikkien listojen saannoista.

    enforced vaatii osoituksen: enforced_by list_rules + src_has (listan oma
    lause, joka toteuttaa yleissaannon) tai rule_kind + kind. gap vaatii
    taskin - ilman sita 'tiedetty puute' on pelkka sana."""
    rules = [r for L in data["lists"] for s in L["secs"] for r in s["rules"]]
    keys = [norm(r.get("src", "")) for r in rules]
    # Moottorissa valvottu yleissaanto ei nay datan saannoissa lainkaan:
    # se on koodia. Todisteeksi kelpaa nimetty laivastotason golden-tapaus,
    # jonka odotus on luettu kirjasta.
    fleet_ids = set(fleet_case_ids())
    title = ref.get("title") or "yleiset"
    for ref_r in ref.get("rules", []):
        where = "%s / %s" % (title[:24], ref_r["key"][:48])
        st = ref_r["status"]
        found = any(norm(ref_r["key"]) in k for k in keys)
        if st == "enforced":
            by = ref_r.get("enforced_by")
            if by == "list_rules":
                need = norm(ref_r.get("src_has", ""))
                if not need:
                    out.append("%s: enforced_by list_rules ilman src_has-kenttaa" % where)
                elif not any(need in k for k in keys):
                    out.append("REGRESSIO %s: listasaantoa %r ei loydy yhdeltakaan "
                               "listalta" % (where, ref_r.get("src_has")))
            elif by == "fleet_golden":
                ids = ref_r.get("goldens") or []
                if not ids:
                    out.append("%s: enforced_by fleet_golden ilman goldens-kenttaa"
                               % where)
                else:
                    gone = [i for i in ids if i not in fleet_ids]
                    if gone:
                        out.append("REGRESSIO %s: laivastotapausta %s ei ole "
                                   "golden_fleet_cases.jsonissa" % (where, gone))
            elif by == "rule_kind":
                if not any(r.get("kind") == ref_r.get("kind") for r in rules):
                    out.append("REGRESSIO %s: saantolajia %r ei ole datassa"
                               % (where, ref_r.get("kind")))
            elif not found:
                out.append("REGRESSIO %s: pitaisi olla valvottu, ei loydy "
                           "saantojen joukosta" % where)
        elif st == "gap":
            if not ref_r.get("task"):
                out.append("%s: gap ilman tehtavaa (task)" % where)
            if found:
                out.append("VANHENTUNUT %s: referenssi sanoo 'gap', mutta lause "
                           "onkin valvottuna - paivita referenssi" % where)
        elif st in ("manual", "not_shown", "out_of_scope"):
            if not ref_r.get("why"):
                out.append("%s: %s ilman perustelua" % (where, st))
        else:
            out.append("%s: tuntematon status %r" % (where, st))


def check_list(ref, data, out):
    name = ref["list"]
    L = find_list(data, name)
    if L is None:
        out.append("%s: listaa ei loydy bfg_data.json:sta" % name)
        return
    rules = [r for s in L["secs"] for r in s["rules"]]
    texts = [t for s in L["secs"] for t in s["text"]]
    rule_keys = [(norm(r.get("src", "")), r) for r in rules]
    text_keys = [norm(t) for t in texts]

    for ref_r in ref.get("rules", []):
        key = norm(ref_r["key"])
        where = "%s / %s" % (name, ref_r["key"][:48])
        hits = [r for k, r in rule_keys if key in k]
        in_text = any(key in t for t in text_keys)
        st = ref_r["status"]
        if st == "enforced" and ref_r.get("enforced_by") == "hull_choice":
            # Valvottu RAKENTEELLA, ei laivastosaannolla: rivi tarjoaa vain
            # kelvolliset rungot (hc=1, hulls[]). Tarkistetaan, etta mekanismi
            # on rakennetussa datassa - muuten "enforced" olisi pelkka sana.
            ents = [e for s in L["secs"] for e in s.get("ents", [])]
            if not any(e.get("hc") == 1 and e.get("hulls") for e in ents):
                out.append("REGRESSIO %s: pitaisi olla runkovalinta (hc=1, hulls), "
                           "listalta ei loydy sellaista rivia" % where)
        elif st == "enforced" and ref_r.get("enforced_by") == "entry_max":
            # Valvottu rivirajana (mx), ei laivastosaantona.
            ents = [e for s in L["secs"] for e in s.get("ents", [])]
            e = next((e for e in ents if e.get("l") == ref_r.get("entry")), None)
            if e is None or e.get("mx") != ref_r.get("mx"):
                out.append("REGRESSIO %s: rivin %r rajan pitaisi olla mx=%r"
                           % (where, ref_r.get("entry"), ref_r.get("mx")))
        elif st == "enforced" and ref_r.get("enforced_by") == "rule_field":
            # Valvottu toisen saannon kentalla (Iyandenin Dragonship-poikkeus
            # on suhdeluvun exempt-kentta).
            hit2 = [r for k, r in rule_keys if norm(ref_r.get("rule_src_has", "")) in k]
            if not hit2 or not any(ref_r.get("field") in r for r in hit2):
                out.append("REGRESSIO %s: saannolta %r puuttuu kentta %r"
                           % (where, ref_r.get("rule_src_has"), ref_r.get("field")))
        elif st == "enforced" and ref_r.get("enforced_by") == "fleet_golden":
            # Valvottu MOOTTORISSA (esim. nimetty reservilupa), ei listan
            # saantorivina. Todisteeksi kelpaa nimetty laivastotapaus.
            ids = ref_r.get("goldens") or []
            if not ids:
                out.append("%s: enforced_by fleet_golden ilman goldens-kenttaa" % where)
            else:
                gone = [i for i in ids if i not in fleet_case_ids()]
                if gone:
                    out.append("REGRESSIO %s: laivastotapausta %s ei ole "
                               "golden_fleet_cases.jsonissa" % (where, gone))
        elif st == "enforced" and ref_r.get("enforced_by") == "structure":
            # Rakenne estaa rikkomuksen (esim. paivitysrivi valitaan kerran).
            if not ref_r.get("why"):
                out.append("%s: enforced_by structure ilman perustelua" % where)
        elif st == "enforced":
            if not hits:
                out.append("REGRESSIO %s: pitaisi olla valvottu, ei ole "
                           "saantojen joukossa" % where)
            else:
                rule_params_ok(ref_r, hits[0], out, where)
        elif st == "gap":
            if hits:
                out.append("VANHENTUNUT %s: referenssi sanoo 'gap', mutta "
                           "saanto onkin nyt valvottu - paivita referenssi"
                           % where)
            elif not in_text:
                out.append("%s: tunnettu puute, mutta lause ei nay edes "
                           "tekstina" % where)
        elif st == "manual":
            if not (in_text or hits):
                out.append("%s: lause ei nay pelaajalle eika ole saantona"
                           % where)
        elif st == "not_shown":
            # Kirjassa on, sovellus ei nayta. Kirjattu tarkoituksella.
            # Jos se ilmestyy nakyviin, referenssi on vanhentunut.
            if in_text or hits:
                out.append("VANHENTUNUT %s: referenssi sanoo 'not_shown', "
                           "mutta lause nakyy nyt - paivita referenssi"
                           % where)
        elif st == "out_of_scope":
            # Kohta 8: paatetty rajauksen ulkopuolelle perusteluineen -
            # kerronnallinen, toisen listan tai profiilin varassa, tai
            # rakenne jota v1 ei mallinna. Ei valvota; nakyvyys ei ratkaise.
            if not ref_r.get("why"):
                out.append("%s: out_of_scope ilman perustelua" % where)
        else:
            out.append("%s: tuntematon status %r" % (where, st))

    # Sama nimi voi esiintya monta kertaa eri hinnalla: esimerkiksi
    # "One re-roll" maksaa Pirate Princella 25 ja Eldar Herolla 50.
    # Siksi nimen takana on lista, ja hinta valitsee oikean rivin.
    have = {}
    for s in L["secs"]:
        for e in s["ents"]:
            have.setdefault(norm(e["l"]), []).append((s["t"], e))
    for ref_e in ref.get("entries", []):
        cands = [e for t, e in have.get(norm(ref_e["name"]), [])
                 # Sama nimi ja hinta voi olla monessa osiossa: tyranidien
                 # "Pyro-acid battery 15" on seka hive shipin
                 # port/starboard-listassa etta Krakenin aselistassa.
                 if "sec" not in ref_e or norm(t) == norm(ref_e["sec"])]
        if not cands:
            out.append("%s: listarivi %r puuttuu%s"
                       % (name, ref_e["name"],
                          (" osiosta %r" % ref_e["sec"]) if "sec" in ref_e
                          else ""))
            continue
        want = ref_e.get("pts")
        e = next((c for c in cands if c.get("p") == want), None) if want is not None             else cands[0]
        if e is None:
            out.append("%s: %r hinta on %s, referenssi odottaa %r"
                       % (name, ref_e["name"],
                          " tai ".join(str(c.get("p")) for c in cands), want))
            continue
        if "mx" in ref_e and e.get("mx") != ref_e["mx"]:
            out.append("%s: %r rivirajoite on %r, referenssi odottaa %r"
                       % (name, ref_e["name"], e.get("mx"), ref_e["mx"]))
        # Poissulkeva ryhma. Kirjan "up to one of the upgrades shown
        # below" toteutuu silla, etta rivit jakavat saman grp-tunnuksen:
        # selain sammuttaa muut kun yksi valitaan.
        if "grp" in ref_e:
            # true = "jokin ryhma riittaa". Osion ja kiinnityskohteen
            # indekseista johdettua tunnusta ei kannata kirjata
            # sellaisenaan, koska se muuttuu osioita lisattaessa.
            if ref_e["grp"] is True:
                if not e.get("grp"):
                    out.append("%s: %r ei kuulu poissulkevaan ryhmaan"
                               % (name, ref_e["name"]))
            elif e.get("grp") != ref_e["grp"]:
                out.append("%s: %r poissulkeva ryhma on %r, referenssi "
                           "odottaa %r"
                           % (name, ref_e["name"], e.get("grp"),
                              ref_e["grp"]))
        if ref_e.get("page") is not None:
            got = str(e.get("r") or "")
            if not got.startswith(str(ref_e["page"])):
                out.append("%s: %r profiilisivu on %r, referenssi odottaa %r"
                           % (name, ref_e["name"], e.get("r"), ref_e["page"]))
    for ref_e in ref.get("extra_entries", []):
        if norm(ref_e["name"]) not in have:
            out.append("%s: lisatty rivi %r puuttuu" % (name, ref_e["name"]))


def check_sentence_groups(data, out):
    """J212: jokaisella osion lauseella on ryhma (sec.cls), ja ryhma tulee
    kasiluokituksesta (referenssi/check_yourself.json) tai saman osion
    saannon src:sta. Uusi lause ilman luokkaa nakyy pelaajalle "Not checked"
    -ryhmassa; se on tiedetty puute, joka luokitellaan kasin."""
    path = os.path.join(HERE, "referenssi", "check_yourself.json")
    cy = json.load(io.open(path, encoding="utf-8"))
    key = lambda t: re.sub(r"[^a-z0-9']+", " ", (t or "").replace("’", "'")
                           .replace("‘", "'").lower()).strip()
    known = set(key(e["text"]) for e in cy["sentences"])
    for L in data["lists"]:
        for s in L["secs"]:
            txt, cls = s.get("text") or [], s.get("cls")
            if cls is None or len(cls) != len(txt):
                out.append("%s / %s: osion lauseilta puuttuu ryhma (cls)" % (L["nm"], s["t"]))
                continue
            srcs = [r.get("src") for r in s.get("rules") or []]
            for t in txt:
                if t not in srcs and key(t) not in known:
                    out.append("%s / %s: luokittelematon lause: %s" % (L["nm"], s["t"], t[:60]))


def main():
    data = json.load(io.open(os.path.join(HERE, "bfg_data.json"),
                             encoding="utf-8"))
    out0 = []
    check_sentence_groups(data, out0)
    refs = load_refs()
    if not refs:
        print("referenssi/-kansiossa ei ole yhtaan tiedostoa")
        return 0
    out = out0
    n_rules = n_ent = 0
    n_general = 0
    for fn, ref in refs:
        n_rules += len(ref.get("rules", []))
        n_ent += len(ref.get("entries", [])) + len(ref.get("extra_entries", []))
        if ref.get("scope") == "general":
            n_general += 1
            check_general(ref, data, out)
        else:
            check_list(ref, data, out)

    done = {r["list"] for _, r in refs if r.get("scope") != "general"}
    todo = [L["nm"] for L in data["lists"] if L["nm"] not in done]

    print("referenssitiedostoja %d / %d listaa%s"
          % (len(refs) - n_general, len(data["lists"]),
             (" + %d yleislukua" % n_general) if n_general else ""))
    print("tarkistettuja saantoja %d, listarivaja %d" % (n_rules, n_ent))
    if todo:
        print("viela referoimatta (%d): %s"
              % (len(todo), ", ".join(t[:28] for t in todo)))
    print()
    for line in out:
        print("  " + line)
    print("loydoksia: %d" % len(out))
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main())
