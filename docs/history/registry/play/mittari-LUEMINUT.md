# Pelisivun syötemittari

Mittaa, montako syötettä (napautus tai pyyhkäisy) Gothic Fleet Play vaatii
saman pelin kirjaamiseen puhelimella. Tehty 19.10.2026 käyttäjän pyynnöstä
"testaa käytännössä ja paranna": ensin vertailuluku nykyiselle sivulle,
sitten jokainen muutos samaa nauhaa vastaan. Mittari noudattaa projektin
UI-periaatetta "kaikki käyttäjän syöte on virhe", ja myös vieritys on
syöte.

```
node   play/mittari/tee_tapahtumat.js 3        # simulaattori → tapahtumat.json (21 peliä)
node   play/mittari/mittaa.js                  # uusi sivu, 375x812, tavat full,swap,compact
node   play/mittari/mittaa.js --sivu=<vanha.html> --nimi=vanha --tavat=full
node   play/mittari/mittaa.js --koko=360x640 --json=tulos.json
python play/mittari/qr_check.py                # sivun QR-kooderi reportlabia vasten
```

## Miten se toimii

1. **Tapahtumanauha** (`tee_tapahtumat.js`). Simulaattori
   (`../simulaattorit yms/simulaattori`, oma git-repo) pelaa käyttäjän
   seitsemän 1200-listaa vastustajia vastaan (Fleet Engagement, 3 peliä
   listaa kohti). Skripti kuuntelee pelin vauriofunktioita (`rawDamage`,
   `applyCritical`, `destroyEscort`, `catastrophic`, `repair`) ja
   vuoronvaihtoa, ja kirjaa mitattavan puolen tapahtumat järjestyksessä:
   vuoro, oman aluksen aktivointi, osumat, kritit (lopullinen tulos), D3/D6-
   lisävauriot, tulipalot, korjaukset, escortin tuho ja Catastrophic-tulos.
   Simulaattorin tekoäly ei ole ihminen, mutta vauriot jakautuvat pelin
   mukaan, eivät arvaamalla. Nauha on talletettu (`tapahtumat.json`), jotta
   luvut ovat vertailukelpoisia, vaikka simulaattori muuttuu.
2. **Toisto** (`mittaa.js`). Oikea Chrome headless-tilassa puhelimen
   koossa ja kosketuksella (CDP Noden omalla WebSocketilla, ei
   riippuvuuksia). Laivasto tulee `play/rosters.json`:sta (samat listat).
   Jokainen tapahtuma tehdään sivun omilla napeilla (`el.click()` → sivun
   oma käsittelijä). Ennen jokaista napautusta mitataan, onko kohde
   näkyvissä ylä- ja alapalkin välissä. Jos ei, lasketaan pyyhkäisyt
   (yksi pyyhkäisy siirtää enintään 80 % näkyvästä alasta) tai
   hyppynauhan napautus, kumpi on halvempi.
3. **Katsominen** (aktivointi): oman aluksen aseiden pitää olla näkyvissä
   (täysi näkymä: taulukko, tiivis: asekooste). Pelattu-merkki on kaksi
   napautusta per alus per oma vuoro, ja se raportoidaan erikseen, koska
   se on vapaaehtoinen.

Mittari ei mittaa lukemiseen tai etsimiseen kuluvaa aikaa, nopan heittoa
eikä vääriä napautuksia. Vertailu on reilu vain saman nauhan ja ruudun
koon sisällä.

## Tulokset 19.10.2026

Luvut ovat lopullisesta sivusta, jossa asetaulukko on piirretty kortin
mallilla (kaksirivinen P/S-pari). Ensimmäinen versio yhdisti parin yhdeksi
riviksi, ja ero oli 0,0–0,1 syötettä per kierros.

21 peliä, 303 pelikierrosta, 1 021 vauriotapahtumaa. Luku on syötteitä per
pelikierros ilman pelattu-merkkejä (suluissa merkkien kanssa).

| ruutu | vanha sivu | uusi, täysi näkymä | uusi, tiivis näkymä | uusi, vaihto puolivuoroittain |
|---|---|---|---|---|
| 360×640 | 13,0 (20,8) | 9,7 (16,9) −25 % | 9,0 (16,6) −31 % | 11,7 (18,8) |
| 375×812 | 11,0 (18,7) | 9,0 (16,2) −18 % | 7,5 (15,1) −32 % | 10,6 (17,9) |
| 412×915 | 10,1 (17,8) | 8,7 (16,0) −14 % | 6,7 (14,1) −34 % | 10,2 (17,7) |

Vieritetty matka 375×812:lla: vanha 527 000 px, täysi 242 000 px, tiivis
161 000 px. Pelattu-merkit maksavat kaikissa noin 7,1–7,4 syötettä per
kierros (2 152 napautusta + pyyhkäisyt).

Erittely 375×812, 21 peliä (napautukset + pyyhkäisyt):

| | vanha | täysi | tiivis |
|---|---|---|---|
| aseiden katsominen | 0 + 1 303 | 209 hyppyä + 701 | 0 + 531 |
| kritit (284 kpl) | 496 + 91 | 499 + 110 | 496 + 112 |
| osumat | 223 + 161 | 264 + 67 | 223 + 67 |
| escortin tuho | 169 + 96 | 184 + 59 | 169 + 65 |
| korjaukset (164 kpl) | 492 + 69 | 164 + 168 paneelin avausta/sulkua | 164 + 168 |
| uusi vuoro | 283 | 283 | 283 |

Mitä luvut kertovat:

- **Aseiden etsiminen oli suurin kulu.** Vanhalla sivulla katsomiset
  maksoivat 1 303 pyyhkäisyä 21 pelissä. Tiivistys (kortin mallinen P/S-pari,
  tiiviimmät taulukon rivit, yksirivinen yläpalkki) ja hyppynauha
  puolittivat vieritetyn matkan.
- **Korjaus** maksoi kolme napautusta (CRIT auki, miinus, kiinni) ja lisäksi
  laivan etsimisen. End Phase -paneelissa korjaus on yksi napautus ja
  avaus ja sulku kerran vaihetta kohti.
- **Näkymän vaihto puolivuoroittain ei kannata** (swap): kaksi napautusta
  kierroksessa maksaa enemmän kuin tiiviillä näkymällä säästää vaurioiden
  kirjauksessa.
- **Tiivis näkymä** on halvin, mutta vain asekoosteen kanssa. Ilman sitä
  joka katsominen avasi kortin (18,4/kierros).
- **Pelattu-merkki** maksaa enemmän kuin kaikki vauriot yhteensä, mutta se
  on vapaaehtoinen muistiapu. Käyttäjä päätti 19.10.2026, että se pysyy
  kahden napautuksen mallina. Siksi vertailuluku on aina "ilman
  pelattu-merkkejä", ja merkkien hinta näkyy vain suluissa.

## Tiedostot

| tiedosto | mitä |
|---|---|
| `tee_tapahtumat.js` | simulaattorin pelit → `tapahtumat.json` (vaatii simulaattorin repon vieressä) |
| `tapahtumat.json` | talletettu nauha, 21 peliä (100 kB) |
| `mittaa.js` | toisto oikeassa Chromessa, yhteenveto ja `--json` |
| `qr_check.py` | pelisivun QR-kooderi reportlabin kooderia vasten kaikilla maskeilla, versiot 1–40 |

Ansat, jotka tulivat vastaan:

- Laskuri pitää nollata joka pelille: ensimmäinen ajo kertoi luvut 21-
  kertaisina.
- Tarttuvien palkkien (ylä, ala, valikko, kortin otsikko) napit ovat aina
  näkyvissä. Ilman tätä NEW TURN maksoi vierityksen joka kerta.
- Hyppynauha on alapalkissa, ei yläpalkin alla. Näkyvä alue on yläpalkin
  alareunasta alapalkin yläreunaan, muuten korkeus menee negatiiviseksi.
- Sivun ruudunvaihtosuoja (0,4 s) hylkäisi mittarin nopeat napautukset,
  joten mittari nollaa `V.guardUntil`in ennen jokaista napautusta.
- Simulaattorin nimetyt alukset ("First Covenant (Venerable Battle
  Barge)") sovitetaan rosterin `R.name`en; Eldarin "Mimic Cruiser" ei ole
  pelisivun rosterissa (1 alus jää sovittamatta).
