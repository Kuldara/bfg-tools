# -*- coding: utf-8 -*-
"""Jokainen lause, jonka PELAAJA nakee sovelluksessa, on kirjassa.

check_quotes.py tarkistaa referenssitiedostot ja golden-tapaukset - siis
sen, mita kehittaja kirjasi. Tama tarkistaa toisen paan: bfg_data.json:n
saantolauseet (rules[].src), osiotekstit (secs[].text) ja rivien
huomautukset (ents[].nt), jotka nakyvat katalogissa, laillisuuspaneelissa
ja korteilla. Jos lause ei ole kirjassa, se on poiminnan tai kuratoinnin
kirjoittama, ja pelaaja lukee sita kirjan saantona.

Kolme lajia, kolme kohtaloa:
  saanto     tarkistusrivin lahdelause. Koottu: otsikko "0-12 Cruisers"
             eteen, sivuviite "(Fleets p. 487)" peraan, usein KAKSI kirjan
             lausetta eri sivuilta (Commerce Protection s.455 + s.457).
             Jokaisen lauseen on oltava kirjassa, ei yhtena jaksona.
  teksti     "Check yourself" -lause. Sama saanto. Litistetty taulukko
             ("2D6 roll Result ...") ei loydy lauseena, ja se raportoidaan
             omana luokkanaan, jotta se ei peita toimituksellista lausetta.
  huomautus  rivin oma taydennys (nt), joka naytetaan omassa laatikossaan.
             Sovelluksen oma teksti, ei kirjan - lasketaan, ei kaadeta.

Toinen kysymys on sivu. Sovellus nayttaa listan sivun, ei lauseen sivua,
ja faktion yhteiset saannot periytyvat listalle sivulta ENNEN listaa.
Kaukana listan sivusta oleva lause on siksi huomio, ei virhe.

    python check_pages.py          loydokset
    python check_pages.py -v       myos huomautukset ja kaukana olevat
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check_quotes as C   # Book, norm, split_elision, MIN_WORDS

VERBOSE = "-v" in sys.argv
FAR = 40   # sivua listan sivusta

#: "0-12 Cruisers " / "(0-1) Flame of Asuryan " -otsikko lauseen edessa
HEAD = re.compile(r"^\s*\(?\d+\s*[-–]\s*\d+\)?\s+[A-Z][A-Za-z'\- ]*?(?=\s+[A-Z][a-z]|\s+\d|$)")
#: "(Fleets p. 487)" / "(Fleets pp. 226-231)" / "(Rulebook p. 65)"
CITE = re.compile(r"\s*\((?:Fleets|Rulebook)\s+pp?\.?\s*[\d\s,–-]+\)\s*")
#: lauseraja: piste, huuto- tai kysymysmerkki ja iso alkukirjain
SENT = re.compile(u"(?<=[.!?])\\s+(?=[A-Z“\"(])")
#: litistetty taulukko tai luettelo: "2D6 roll Result", "D6 ROLL", "Renown
#  Title Ld", "chosen from the following list:", hintarivit "+20 /+40 pts".
#  Poiminnan muoto, ei lauseen virhe - raportoidaan erikseen.
TABLE = re.compile(r"\b(?:2?D6\s+ROLL|2D6\s+roll\s+Result|Renown\s+Title|Roll\s+Result"
                   r"|following\s+list:|for\s+the\s+points\s+shown:)"
                   r"|^\(\+1/-1\)|^\+\d+\s*/\+\d+\s*pts", re.I)


def words(t):
    return len(re.findall(r"[A-Za-z0-9']+", t or ""))


#: Kuratoitu lisays lainaa kirjaa etiketin kanssa: 'Yriel (Fleets p. 319):
#  "you may instead pick ..."' tai 'Pg. 373: "There is no ..."'. Etiketti ja
#  lainausmerkit pois, lainaus itse tarkistetaan.
LABEL = re.compile(r"^\s*(?:Pg\.\s*\d+|[A-Z][A-Za-z']{1,20})\s*:\s*")
QUOTES = u"\"'“”‘’"


def pieces(t):
    t = CITE.sub(" ", t or "")
    t = HEAD.sub("", t, count=1)
    out = []
    for part in C.split_elision(t):
        for x in SENT.split(part):
            x = (x or "").strip()
            if not x:
                continue
            x = LABEL.sub("", x, count=1).strip().strip(QUOTES).strip()
            if x.endswith(".") and x[:-1].rstrip().endswith(tuple(QUOTES)):
                x = x[:-1].rstrip().strip(QUOTES).strip()
            if x:
                out.append(x)
    return out


def main():
    book = C.Book(C.FLEETS)
    rules = C.Book(C.RULEBOOK) if os.path.exists(C.RULEBOOK) else None
    d = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))
    bad, table, note, far, n = [], [], [], [], 0
    for L in d["lists"]:
        lpg = int(L.get("pg") or 0)
        for sec in L.get("secs", []):
            items = []
            for r in sec.get("rules") or []:
                if r.get("src"):
                    items.append(("saanto", r["src"]))
            for t in sec.get("text") or []:
                items.append(("teksti", t))
            for en in sec.get("ents") or []:
                if en.get("nt"):
                    items.append(("huomautus", en["nt"]))
            for kind, t in items:
                for part in pieces(t):
                    if words(part) < C.MIN_WORDS:
                        continue
                    n += 1
                    w = C.norm(part)
                    where = "%s / %s / %s" % (L["nm"], sec.get("t", "?")[:28], kind)
                    if book.has(w):
                        pg = book.page_of(w)
                        if pg and lpg and abs(pg - lpg) > FAR:
                            far.append("%s: s.%d, lista s.%d: %s" % (where, pg, lpg, part[:70]))
                        continue
                    if rules is not None and rules.has(w):
                        continue
                    line = "%s: ei kirjassa: %s" % (where, part[:95])
                    if kind == "huomautus":
                        note.append(line)
                    elif TABLE.search(part):
                        table.append(line)
                    else:
                        bad.append(line)
    for x in bad:
        print("  " + x)
    if table:
        print("\n  -- litistetty taulukko (poiminnan muoto, ei lauseen virhe) --")
        for x in table[:VERBOSE and 200 or 8]:
            print("  " + x)
        if not VERBOSE and len(table) > 8:
            print("  ... ja %d muuta (-v nayttaa kaikki)" % (len(table) - 8))
    if VERBOSE and note:
        print("\n  -- rivin huomautus, sovelluksen oma teksti --")
        for x in note:
            print("  " + x)
    if VERBOSE and far:
        print("\n  -- kaukana listan sivusta (huomio) --")
        for x in far:
            print("  " + x)
    print("\nlauseita tarkistettu %d, ei kirjassa %d, taulukoita %d, omia huomautuksia %d, "
          "kaukana listan sivusta %d" % (n, len(bad), len(table), len(note), len(far)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
