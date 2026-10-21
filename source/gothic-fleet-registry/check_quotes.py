# -*- coding: utf-8 -*-
"""Jokainen kirjatuksi merkitty kirjan lause on oikeasti kirjassa.

Projektin koko totuusketju nojaa sitaatteihin: golden-tapauksen `why`
perustelee odotuksen kirjan lauseella, ja referenssitiedoston `text` on
kirjan lause sivunumeroineen. Jos sitaatti on parafraasi, perustelu nayttaa
vahvemmalta kuin se on - eika mikaan muu tarkistus huomaa sita, koska
kaikki muu vertaa dataa itseensa.

Loytyi nain 14.9.2026: golden `tau-hooks-exactly-full` lainasi "the gravitic
hooks in the fleet", kun s.454 sanoo "the gravitic hook capacity of the
fleet".

Kysymys on "onko tama kirjan lause", ei "onko se juuri talla sivulla":
tapauksen `why` selittaa usein viittaamalla toiseen kirjan kohtaan (s.35:n
laivue-lause viittaa itse s.13:een, ja golden lainaa molempia). Sitaatti
tarkistetaan siksi koko kirjaa vasten; vaara sivunumero raportoidaan
erikseen huomiona, ei virheena.

Vertailu on reipas: pienet kirjaimet, ligatuurit puretaan, kaikki muu
paitsi kirjaimet ja numerot pois. Nain PDF:n tavutus, rivinvaihdot ja
kaarevat lainausmerkit eivat tuota vaaria loydoksia.

    python check_quotes.py          loydokset
    python check_quotes.py -v       myos hyvaksytyt
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REFDIR = os.path.join(HERE, "referenssi")
FLEETS = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
RULEBOOK = r"F:\3D print LLM\Battlefleet Gothic\chatgpt-projekti\20_SAANNOT_Rulebook_v1-10.pdf"

#: Kolmas lahde. Liittolaismatriisi on Fleets s.17:n otsikko, mutta itse
#  taulukko puuttuu tasta painoksesta; Remasteredin verkkoversio palauttaa
#  sen 2010 FAQ:sta. Sanatarkka teksti on tallennettu repoon, jotta siihen
#  nojaava sitaatti on tarkistettavissa kuten kirjan lause.
FAQ = os.path.join(HERE, "referenssi", "liittolaismatriisi_2010_faq.txt")
#: Neljas lahde (kayttajan paatos 20.10.2026): High Admiraltyn Collected FAQ
#  2026 on kolmas auktoriteetti kirjojen rinnalla ja voittaa ne ristiriidassa.
#  Lukittu vienti on kopioitu repoon tavu tavulta
#  (tulosteet/ref/warp_rift/faq2026_live_20261020.txt), jotta siihen nojaava
#  sitaatti on tarkistettavissa. Elava dokumentti muuttuu: uutta vientia ei
#  vaihdeta tahan ilman tarkistusta.
FAQ2026 = os.path.join(HERE, "referenssi", "faq2026_20261020.txt")

MIN_WORDS = 5          # lyhyempi katkelma ei erota mitaan
VERBOSE = "-v" in sys.argv

#: Kirjan PDF ladotaan ligatuureilla: "fleet" on tiedostossa "ﬂeet". Ilman
#  purkua normalisointi pudottaa ligatuurin kokonaan ("eet"), eika yksikaan
#  fleet-sanan sisaltava sitaatti loydy.
LIGATURES = {u"\ufb00": "ff", u"\ufb01": "fi", u"\ufb02": "fl",
             u"\ufb03": "ffi", u"\ufb04": "ffl", u"\ufb05": "st",
             u"\ufb06": "st", u"\u0153": "oe", u"\u00e6": "ae",
             # Kirja latoo kertolaskun oikealla kertomerkilla ("D6×50"),
             # kirjaaja nappaimiston x:lla. Ilman tata s.141 ei loydy.
             u"\u00d7": "x"}

#: Heittomerkkien valiin jaa myos suomea: "Kor'el (Ld 8) ei ole Kor'O" antaa
#  katkelman "el (Ld 8) ei ole Kor". Naita ei etsita kirjasta.
FI_WORDS = set(("ei on ja joten koska kirjan sivu laivasto laivaston ovat "
                "pistokoe pistokokeen optio optiota tulosti hinnan kortti "
                "kortin rivi rivin osio osion nayttaa naytti ilmaista "
                "saanto saannon tama sen han kun jos mutta myos vain sita "
                "siis eika seka jotta kuin siten silloin ilman kaksi yksi "
                "kolme risteilija risteilijaa pistetta hinnat yhteensa "
                "tayttyy kelpaa lause lauseen mukaan").split())


#: Kaikki lainausmerkeissa oleva ei ole kirjan lausetta. Naissa neljassa
#  se on tarkoitus, ja syy on kirjattu tahan - muuten tarkistus ei erottaisi
#  unohdusta harkitusta poikkeuksesta.
NOT_BOOK_OK = {
    # Perustelu lainaa nimenomaan PDF-poiminnan virhetta: s.481:n
    # SPECIAL-laatikko ja Ion cannon -rivi menevat paallekkain, ja poiminta
    # yhdistaa aserivin lauseen sisaan. Tapaus vartioi juuri sita, ettei
    # kasin tehty taydennys katoa.
    "even if Ion cannon 30 cm 1 All round planetary":
        "s.481 poimintavirhe, lainattu tarkoituksella",
    # Nama kolme ovat laivastolistan oman rivin nimi, eivat kirjan lause:
    # perustelu sanoo "listan 'X'" ja vertaa sita kirjan OPTIONS-lauseeseen,
    # joka tarkistetaan normaalisti.
    "Torpedo-bommas +10 / launch bay": "listan rivin nimi, ei kirjan lause",
    "Boarding torpedoes (Space Hulk) 15": "listan rivin nimi, ei kirjan lause",
    "Nova Cannon instead of prow torpedoes 20": "listan rivin nimi, ei kirjan lause",
}


def norm(s):
    s = (s or "").lower()
    for a, b in LIGATURES.items():
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", s)


def is_finnish(t):
    w = set(re.findall(r"[a-zA-Zaou\u00e4\u00f6]+", (t or "").lower()))
    return bool(w & FI_WORDS) or bool(re.search(u"[\u00e4\u00f6]", t or ""))


class Book(object):
    """Kirja kerran muistiin: koko teksti hakua varten ja sivuittain, jotta
    vaara sivunumero voidaan nimeta."""

    def __init__(self, path):
        import fitz
        self.doc = fitz.open(path)
        self.pages = []
        for i in range(self.doc.page_count):
            t = self.doc[i].get_text("text")
            # Sivu alkaa sivunumerollaan; jos se jaa tekstiin, sivun yli
            # jatkuva lause katkeaa siihen.
            t = re.sub(r"^\s*%d\s*\n" % (i + 1), "", t)
            self.pages.append(norm(t))
        # Ilman erotinta: kirjan lause jatkuu usein seuraavalle sivulle
        # (s.370 "...to ram and causes" -> s.371 "1Hp before rolling to
        # inflict damage."), ja erotin katkaisi haun juuri siihen.
        self.all = "".join(self.pages)

    def has(self, want):
        return want in self.all

    def page_of(self, want):
        for i, p in enumerate(self.pages):
            if want in p:
                return i + 1
        # sivun yli jatkuva lause
        for i in range(len(self.pages) - 1):
            if want in (self.pages[i] + self.pages[i + 1]):
                return i + 1
        return None


def quotes(text):
    """Lainausmerkeissa olevat katkelmat. Kaytossa on kolme tapaa lainata:
    'suora', kaareva ja "kaksinkertainen".

    Kirjaaja jattaa usein valista pois ("... "), ja taulukkorivi voi olla
    kirjassa eri jarjestyksessa kuin lainauksessa. Osat tarkistetaan siksi
    erikseen: jokaisen on loydyttava kirjasta, mutta ei yhtena jaksona."""
    out = []
    for pat in (r"'([^']{12,400})'", u"\u2018([^\u2019]{12,400})\u2019",
                u"\u201c([^\u201d]{12,400})\u201d", r'"([^"]{12,400})"'):
        out.extend(re.findall(pat, text or ""))
    return [p for q in out for p in split_elision(q)]


def split_elision(t):
    return [x.strip() for x in re.split(u"\\s*(?:\\.\\.\\.|\u2026)\\s*", t or "")
            if x and x.strip()]


def check(book, where, page, text, bad, note, page_is_claim=False):
    """Yksi sitaatti. Palauttaa 1 jos se tarkistettiin.

    page_is_claim: referenssitiedoston `page` sanoo missa saanto on, joten
    vaara sivu on loydos. Goldenin `why` lainaa usein toista kirjan kohtaa
    perustellakseen, joten sen sivuero on vain huomio."""
    if not text:
        return 0
    if is_finnish(text):
        return 0
    if text.strip() in NOT_BOOK_OK:
        if VERBOSE:
            print("  ohi  %s  (%s)" % (where, NOT_BOOK_OK[text.strip()]))
        return 0
    if len(re.findall(r"[A-Za-z0-9']+", text)) < MIN_WORDS:
        return 0
    want = norm(text)
    if getattr(book, "other", None) is not None and book.other.has(want):
        if VERBOSE:
            print("  ok   %s (Rulebook)  %s" % (where, text[:60]))
        return 1
    if getattr(book, "faq", "") and want in book.faq:
        if VERBOSE:
            print("  ok   %s (2010 FAQ)  %s" % (where, text[:60]))
        return 1
    if getattr(book, "faq2026", "") and want in book.faq2026:
        if VERBOSE:
            print("  ok   %s (FAQ 2026)  %s" % (where, text[:60]))
        return 1
    if not book.has(want):
        bad.append("%s: ei ole kirjan lause (s.%s): %s" % (where, page, text[:95]))
        return 1
    if page:
        pg = int(page)
        near = [p for p in (pg - 1, pg, pg + 1) if 1 <= p <= len(book.pages)]
        if not any(want in book.pages[p - 1] for p in near) and \
                not any(want in (book.pages[p - 1] + book.pages[p % len(book.pages)])
                        for p in near):
            found = book.page_of(want)
            if found is not None and abs(found - pg) > 1:
                line = ("%s: lause on s.%d, kirjattu s.%s: %s"
                        % (where, found, page, text[:70]))
                (bad if page_is_claim else note).append(line)
    if VERBOSE:
        print("  ok   %s s.%s  %s" % (where, page, text[:60]))
    return 1


def main():
    book = Book(FLEETS)
    # Projektissa on kaksi kirjaa. Kortin saantoteksti ja moni golden
    # lainaa Rulebookia (kriittiset osumat, rampautuminen, boarding), ja
    # sen sivunumerot ovat oma sarjansa - siksi vain "onko lause kirjassa"
    # tarkistetaan sita vasten, ei sivunumeroa.
    rules_book = Book(RULEBOOK) if os.path.exists(RULEBOOK) else None
    book.other = rules_book
    book.faq = norm(io.open(FAQ, encoding="utf-8").read()) if os.path.exists(FAQ) else ""
    book.faq2026 = norm(io.open(FAQ2026, encoding="utf-8-sig").read()) if os.path.exists(FAQ2026) else ""
    bad, note, n = [], [], 0

    for fn, key in (("golden_fleet_cases.json", "golden_fleet"),
                    ("golden_cases.json", "golden")):
        p = os.path.join(REFDIR, fn)
        if not os.path.exists(p):
            continue
        for c in json.load(io.open(p, encoding="utf-8")).get("cases", []):
            for q in quotes(c.get("why", "")):
                n += check(book, key + "/" + c["id"], c.get("page"), q, bad, note)

    for fn in sorted(os.listdir(REFDIR)):
        if not re.match(r"\d\d_.*\.json$", fn):
            continue
        d = json.load(io.open(os.path.join(REFDIR, fn), encoding="utf-8"))
        for r in d.get("rules", []):
            t, pg = r.get("text"), r.get("page")
            if not t:
                continue
            # Kirjaaja on voinut jattaa valista pois ("... "); osat erikseen.
            for part in split_elision(t):
                n += check(book, "%s/%s" % (fn[:2], r["key"][:30]), pg, part,
                           bad, note, page_is_claim=True)

    for line in bad:
        print("  " + line)
    if note:
        print("\n  -- sivunumero eri kuin mista lause loytyy (huomio) --")
        for line in note:
            print("  " + line)
    print("\nsitaatteja tarkistettu %d, ei-kirjan lauseita %d, sivuhuomioita %d"
          % (n, len(bad), len(note)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
