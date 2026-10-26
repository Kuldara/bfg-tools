# P1-1 · Yksi totuus per alus

**Tila:** valmis 8.9.2026 (v0) · **Koko:** pieni · **Portti:** P1-2 ja P1-3 odottavat riippumatonta katselmointia

## Tehty

`resolveUnit(u)` v0 on julkisivu nykyisille laskimille — mitään ei
lasketa uudella tavalla. Laivastonäkymä, rosteri ja kortti lukevat sitä.
Copy list lukee jo `unitPts`ia eikä statseja; editori kloonaa kortin.

Todistus: tilannekuva kaikista 462 kortista ennen ja jälkeen — **0
korttia muuttui tavuakaan.** Laivastonäkymä muuttui 7 rivillä, kaikki
tyranideja: `Turrets` → `Spores`, koska sarakkeen nimi tulee nyt
ratkaisimesta kuten kortilla jo ennestään.

Golden: pinnat yksimielisiä kaikilla 23 tapauksella; rosteri lisätty
viidenneksi pinnaksi ja se löysi saman vian (`sh.hp` raakana).
`surface_disagreements 4 → 0`, `golden_failures 4 → 0`.

Ratkaisin sietää yksikön ilman listariviä (hinta `null`): se on
sopimuksen mukainen tila (puolustus listan ulkopuolelta), ei virhe.

## Seuraava: riippumaton katselmointi, sitten v1

v0 nojaa yhä globaaliin `S`-tilaan (`shipOf`, `entOf`, `upState`).
Puhdas `resolveUnit(intent, fleet, catalog)` on kirjattu tavoitteeksi
`docs/DEFINITION_OF_DONE.md`:hen. Rajapinta on katselmoitava ennen kuin
yhtään vaikutusta lisätään sen päälle.

---

*Alkuperäinen tehtävänanto säilytetty alla.*

Lue ensin: `AGENTS.md`, `docs/DOMAIN_CONTRACT.md`.

## Vika on jo todistettu punaisena

```
node test_golden.js
```

```
warsphere-add-2hp-x1    s.494  OK  OK  EI    hits: ratkaisin=12 laivastonakyma=10
warsphere-add-2hp-x3    s.494  OK  OK  EI    hits: ratkaisin=16 laivastonakyma=10
warsphere-sub-2hp-x2    s.494  OK  OK  EI    hits: ratkaisin=6  laivastonakyma=10
warsphere-extra-shield  s.494  OK  OK  EI    shields: ratkaisin=3 laivastonakyma=2
```

Hinta on oikein. Kortti on oikein. **Laivastonäkymä näyttää perusarvon.**
Pelaaja maksaa 205 pistettä ja näkee rakentaessaan 10 osumapistettä,
vaikka kortille tulostuu 16.

## Paikannettu syy

`app_template.html`, `renderFleet()`, noin rivi 1643:

```js
const stats = sh ? `<div class="stats">
  <span><b>Hits</b> ${sh.hp||"–"}</span>          ← perusarvo
  <span><b>Speed</b> ${esc(sh.sp)}</span>
  <span><b>Turns</b> ${esc(sh.tn)}</span>
  <span><b>Shields</b> ${esc(sh.sh)}</span>       ← perusarvo
  <span><b>Armour</b> ${esc(sh.ar)}</span>
  <span><b>Turrets</b> ${esc(effTurrets(u, sh))}</span>   ← efektiivinen
```

Tornit tulevat jo efektiivisestä. Osumat ja kilvet eivät. Ero syntyi
epähuomiossa, ei päätöksellä — mikä on juuri se syy, miksi profiilia ei saa
laskea useassa paikassa.

## Tehtävä

1. **Lisää `resolveUnit(u, sh)`** `app_template.html`:ään.
   Se kokoaa nykyiset funktiot (`unitPts`, `effHits`, `effShieldsText`,
   `effTurrets`, `armModel`, `crippledLine`) yhdeksi tulokseksi
   `docs/DOMAIN_CONTRACT.md`:n muodossa. **Älä muuta yhtään laskentaa** —
   tämä on kokoamista, ei uutta logiikkaa.

2. **Ohjaa laivastonäkymä sen läpi.** `renderFleet()` lukee
   `resolveUnit()`-tulosta, ei `sh`-kenttiä.

3. **Ohjaa kortti sen läpi.** `cardHTML()` lukee samaa tulosta.
   Kortti saa yhä lyhentää kilven (`shortShield`) — esitystapa saa erota,
   arvo ei.

4. **Ohjaa rosteri, Copy list ja muokattava vienti sen läpi.**

## Valmis kun

```
node test_golden.js
```

- **PINNAT-sarake on OK kaikilla 20 tapauksella.**
- Yksikään muu sarake ei muutu. `mars-third-turret` ja muut neljä pysyvät
  `GAP`-tilassa — niitä ei korjata tässä tehtävässä.

```
python acceptance.py
```

- TUOMIO muuttuu `HYLATTY` → `VAKAUTUS KESKEN`.
- Kaikki muut tarkistimet pysyvät vihreinä. Erityisesti `print_check.js`
  (462 korttia) ja `stress.js` (76 154 tarkistusta) eivät saa muuttua.

## Älä tee tässä tehtävässä

- Älä lisää yhtään uutta vaikutustyyppiä (se on P1-2 ja P1-3).
- Älä siisti ratkaisimen sisusta. Ensin kaikki pinnat sen läpi, vasta
  sitten sisus.
- Älä muuta korttien ulkoasua.
- Älä koske `share version/`-kansioon.

## Miksi tämä on ensin

Niin kauan kuin profiilikäsityksiä on viisi, jokainen uusi vaikutus on
viisi toteutusta. 42 mallintamatonta optiota × 5 pintaa = 210 muutosta.
Tämän jälkeen ne ovat 42.
