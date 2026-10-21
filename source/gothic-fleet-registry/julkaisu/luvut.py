# -*- coding: utf-8 -*-
"""Julkaisutekstien luvut yhdesta paikasta, laskettuna datasta.

Luvut olivat kasin kirjoitettuina viidessa tiedostossa ja ehtivat eriytya:
esite, OG-kuva ja Reddit-dia sanoivat "30 listaa, 460 korttia" (luvut ajalta
ennen kuin Grey Knights ja Eldar Corsairs erotettiin omiksi listoikseen),
kun sivuston metakuvaus sanoi "32 fleet lists, 635 cards". Codex-katselmointi
15.9.2026 huomasi ristiriidan; pelaaja nakee molemmat.

Sama periaate kuin `docs/EHDOTUS-about-ja-guide.md`:ssa: luku, jota ei
lasketa, vanhenee huomaamatta. `check()` kaataa generaattorin, jos siihen
kirjoitettu luku ei vastaa dataa - vaara luku on silloin buildin kaatuminen
eika lukijan ongelma.

    from luvut import LUVUT, check
    check(lists="30")        # AssertionError: listoja on 32
"""
import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.dirname(HERE)


def _data():
    with io.open(os.path.join(BUILDER, "bfg_data.json"), encoding="utf-8") as f:
        return json.load(f)


def _cards(d):
    """Tulostettavia kortteja. SAMA saanto kuin print_check.js:lla, joka
    renderoi ne oikeasti (rivi 71): rivilla on profiiliviite ja viite
    ratkeaa. Pelkka `en.r` ei riita - osa riveista viittaa profiiliin, jota
    ei ole, ja niista ei synny korttia. Ero on 70 korttia."""
    ships = d["ships"]
    n = 0
    for L in d["lists"]:
        for sec in L.get("secs", []):
            for en in sec.get("ents", []):
                if en.get("r") and str(en["r"]) in ships:
                    n += 1
    return n


def compute():
    d = _data()
    return {
        "lists": len(d["lists"]),
        "profiles": len(d["ships"]),
        "cards": _cards(d),
    }


LUVUT = compute()


def check(**kw):
    """Tarkistaa generaattoriin kirjoitetut luvut dataa vasten."""
    for k, v in kw.items():
        want = LUVUT[k]
        got = int(str(v).replace(" ", ""))
        assert got == want, (
            "julkaisuteksti sanoo %s = %s, data sanoo %d "
            "(julkaisu/luvut.py)" % (k, v, want))
    return True


if __name__ == "__main__":
    for k in ("lists", "profiles", "cards"):
        print("  %-9s %d" % (k, LUVUT[k]))
