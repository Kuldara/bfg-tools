# Builderin syötemittari: Da Ork Clanz

Mittaa, montako syötettä (napautus, pudotusvalikko tai vieritys) saman
Da Ork Clanz -laivaston rakentaminen vaatii. Tehty 20.10.2026 käyttäjän
pyynnöstä: *"tuo ork clanz rakentaminen on kyl aika tuskaa. mieti ja testaa ja
mieti yms miten saisit siitä hyvän käyttökokemuksen"* ja *"huomio että ...
käyttäjä ei tiedä sääntöjä oikein kunnolla vaan joutuu selaamaan ja
yrittämään"*. Periaate on sama kuin pelisivun mittarissa (`play/mittari/`):
kaikki käyttäjän syöte on virhe, myös vieritys.

```
node mittari/clanz.js                                   # uusi UI, suunniteltu, puhelin 375x812
node mittari/clanz.js --tapa=selaus --koko=1440x900
node mittari/clanz.js --sivu=<vanha.html> --ui=vanha    # vertailu vanhaan sivuun
node mittari/clanz.js --kuvat=<kansio>                  # kuvat katalogista ja Your fleetistä
```

## Tehtävä

1 500 pistettä, kolme Warlordia (yksi per 500 pts tai osa, Fleets s. 372):

| Warlord | re-rollit | klaani | alukset |
|---|---|---|---|
| 1 | 2 | Goffs | Hammer ('Uge), Terror + Kill (yksi big ship skwadron), Ravager ×4, Brute ×3; Extra Turrets hänen aluksellaan |
| 2 | 1 | – | Kill kroozer, Savage ×5 |
| 3 | 1 | – | Rok, Onslaught ×3 |

Kaksi tapaa: **suunniteltu** (pelaaja tietää järjestyksen: Warlord ja heti
hänen aluksensa) ja **selaus** (Warlordit ensin, sitten katalogia alaspäin ja
jako Warlordeille). Mittari tarkistaa lopuksi, että laivasto on sama kuin
tehtävässä: Warlordien re-rollit, klaani jokaisella skwadronilla, alukset
Warlordeittain ja laillisuuspaneelissa ei punaista.

## Miten se laskee

Oikea Chrome headless-tilassa (CDP Noden omalla WebSocketilla, ei
riippuvuuksia). Jokainen askel tehdään sivun omilla napeilla. Ennen
napautusta mitataan, onko kohde näkyvissä tarttuvan yläreunan alla; jos ei,
lasketaan pyyhkäisyt (enintään 80 % näkyvästä alasta per pyyhkäisy).
Puhelimella sivun oma pyyhkäisy Your fleetiin ja takaisin lasketaan yhdeksi
syötteeksi, kun se on halvempi. Pudotusvalikko on kaksi syötettä.

Mittari ei mittaa lukemiseen, sääntöjen etsimiseen eikä laskemiseen kuluvaa
aikaa. Juuri se oli suurin tuska, ja siihen vastaa lohkon ja palkin
"Needs"-rivi (mitä Warlordilta vielä puuttuu, sanoin).

## Tulokset 20.10.2026

| ruutu, tapa | vanha | uusi (J226) |
|---|---|---|
| 375×812, suunniteltu | 84 (27 napautusta, 4 valikkoa, 53 vieritystä) | 32 (19 / 0 / 13) −62 % |
| 375×812, selaus | 111 (27 / 18 / 66) | 34 (22 / 0 / 12) −69 % |
| 1440×900, suunniteltu | 57 (27 / 4 / 26) | 27 (19 / 0 / 8) −53 % |
| 1440×900, selaus | 81 (27 / 18 / 36) | 29 (22 / 0 / 7) −64 % |

Vanhassa suurin kulu oli vieritys laivastonäkymässä: klaani ostettiin viidelle
yksikölle erikseen 19 rivin taitetusta listasta, ja selatessa jokainen alus
siirrettiin oikealle Warlordille pudotusvalikolla (14 syötettä).

`acceptance.py` ajaa vaiheessa CLANZ-UI tavan *selaus* puhelimen koossa ja
hylkää, jos lopputila poikkeaa tehtävästä.
