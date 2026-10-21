# Kirjasta luettu totuus: `referenssi/`

Tämä kansio on projektin muisti siitä, **mitä kirjassa lukee** — erillään
siitä, mitä sovellus tekee. Ilman sitä jokainen kierros tulkitsee samat
sääntökohdat uudelleen, ja jokainen tulkinta on eri.

**Älä luo tämän rinnalle toista totuuslähdettä.** Kaksi rinnakkaista
sääntötotuutta eroaa toisistaan kolmannella kierroksella eikä kukaan tiedä
kumpi voittaa. Laajenna tätä.

## Kansion sisältö

| tiedosto | mitä | tarkistin |
|---|---|---|
| `NN_laivastolista.json` | yhden listan säännöt ja rivit | `check_reference.py` |
| `golden_cases.json` | odotustapaukset, ajetaan kaikkia pintoja vasten | `test_golden.js` |
| `optiot.json` | aluksen optioiden vaikutukset (uusi, täytetään) | `audit_effects.py` |
| `LUEMINUT.md` | listareferenssien lukuohje | |

Tiedostonimen kuvio ratkaisee: `check_reference.py` lukee vain
`NN_*.json`-tiedostot, joten muu totuus voi asua samassa kansiossa omalla
skeemallaan.

## 1. Listasäännöt — `NN_*.json`

Valmis: **32/32 listaa, 488 sääntöä, 688 listariviä, nolla löydöstä.**

```json
{ "key":  "0-3 Battle Barges",
  "text": "0-3 Battle Barges",
  "page": 97,
  "status": "enforced",
  "kind": "section_count",
  "min": 0, "max": 3 }
```

Tila kertoo, mitä säännöltä odotetaan:

| tila | merkitys |
|---|---|
| `enforced` | moottori valvoo — rikkominen näkyy punaisena |
| `manual` | riittää että sääntö näkyy pelaajalle |
| `gap` | **pitäisi valvoa, ei valvota** — työjonoa |
| `not_shown` | kirjassa on, sovellus ei näytä — päätös tekemättä |
| `out_of_scope` | päätetty rajauksen ulkopuolelle perusteluineen (kerronnallinen, toisen listan tai profiilin varassa, rakenne jota v1 ei mallinna); ei valvota, näkyvyys ei ratkaise |

Nykyinen jakauma on `docs/DEVELOPMENT_STATUS.md`:ssä (generoitu).

`enforced` tarkoittaa oletuksena, että sääntö on moottorin sääntöjoukossa
(`check_reference.py` etsii sen avaimella). Sääntö voi olla valvottu myös
**rakenteella**: Venerable battle bargen runkovalinta valvotaan sillä, että
rivi tarjoaa vain kelvolliset rungot. Silloin rivillä on
`"enforced_by": "hull_choice"` (tai `entry_max` = rivin `mx`, `rule_field` = toisen säännön kenttä kuten `exempt`, `structure` = rakenne estää rikkomuksen), ja tarkistin varmistaa mekanismin
rakennetusta datasta (`hc=1`, `hulls[]`) — "enforced" ei saa olla pelkkä
sana.

## 2. Golden-tapaukset — `golden_cases.json`

Odotus **luetaan kirjasta**, ei sovelluksesta. Jokaisella tapauksella on
sivunumero ja `why`, joka kertoo mistä luku tulee.

```json
{ "id": "mars-third-turret",
  "page": 61,
  "ship": "61",
  "status": "gap",
  "task": "tasks/P1-2-lisaavat-statsivaikutukset.md",
  "select": [{ "option": "third turret" }],
  "expect": { "points": 280, "turrets": "3" },
  "why": "Perushinta 270 + 10. 'May purchase a third turret for an
          additional +10 points.' Perus 2 tornia." }
```

Kentät:

- `ship` — profiilisivu. Ajuri etsii aluksen listariveiltä itse; jos alus
  ei ole yhdelläkään rivillä (esim. Waystation s.481), ajetaan vain
  profiilitarkistukset ja se kerrotaan raportissa.
- `select` — valinnat option **tekstin** perusteella, ei indeksin.
  Indeksi siirtyy kun kirja muuttuu; teksti dokumentoi myös aikeen.
  `qty` toistettaville.
- `expect` — `points`, `hits`, `shields`, `turrets`, `weapon_rows`,
  `weapon: {match, range, fp, arc}`, `card_contains`, `card_lacks`,
  `exclusive_group_blocks`.
- `status: "gap"` + `task` — tiedetty puute. Tapaus kirjoitetaan **ennen**
  korjausta ja se on punainen kunnes tehtävä on tehty.

Ajuri tarkistaa jokaisen tapauksen viittä pintaa vasten — hinta,
ratkaisin, kortti, laivastonäkymä, tallennuskierros — ja raportoi pintojen
erimielisyyden omana luokkanaan. Se on ainoa tapa estää tilanne, jossa
kortti sanoo 16 HP ja laivastonäkymä 10.

**Jos `gap`-tapaus menee läpi, sekin raportoidaan.** Silloin tehtävä on
tehty ja status pitää päivittää — muuten aukoista tulee hiljainen
karanteeni, jonne epämukavat testit katoavat.

### Mitä tapauksia kannattaa lisätä

Kattavuus ei tarkoita jokaista alusta vaan jokaista **mekaniikkaa**:

- jokainen vaikutustyyppi (`mod`, `swp`, `sw`, `aws`, `qty`, `add`)
- lisäävän vaikutuksen **poisto**: rivi katoaa, kun valinta puretaan
- poikkeavat vauriomallit (space hulk, quadrant)
- toistettavat valinnat
- riippuvuudet ja poissulkevat ryhmät
- listakohtaiset pakolliset muutokset
- geneerinen pohjarunkovalinta (Venerable battle barge)
- tallennusmigraatiot

## 3. Optioiden vaikutukset — `optiot.json`

`audit_effects.py` tuottaa tarkistusjonon: optiot, joiden teksti lupaa
profiilimuutosta mutta joilla ei ole rakenteista vaikutusta. Jonossa on nyt
**42 riviä**.

Työkalu **ei päätä sääntöä**. Ihminen tai agentti lukee kirjan sivun ja
kirjaa päätöksen:

```json
{ "options": [
  { "ship": "MARS CLASS BATTLECRUISER",
    "text": "May purchase a third turret for an additional +10 points.",
    "page": 61,
    "effect": { "mod": { "tu": 1 } },
    "why": "Kirja: kolmas torni, perus 2. Toteutettu OPT_EFFECTS-tauluun.",
    "verified": true }
] }
```

Kuitattu rivi poistuu jonosta. Kuittaus ilman sivunumeroa ei kelpaa.

Toteutus tehdään `build_data.py`:n `OPT_EFFECTS`-tauluun — se on ainoa
paikka, jossa vaikutus saa syntyä. Älä päättele vaikutusta tekstistä
ajonaikaisesti.

## 4. Tilaportaat

Sääntötiedon kypsyys, karkeimmasta valmiiseen:

```
unreviewed       ei kukaan ole lukenut kirjan sivua
extracted        poimittu automaattisesti, ei tarkistettu
source-verified  ihminen on lukenut sivun ja kirjannut sen
implemented      moottori soveltaa sitä
golden-tested    riippumaton tapaus todistaa sen
```

`referenssi/NN_*.json`:n `status` kattaa portaat 3–4 listasäännöille.
`golden_cases.json` kattaa portaan 5. `optiot.json` tuo portaat 3–5
aluksen optioille.

Valmiutta mitataan näillä — ei vihreiden testien lukumäärällä. Vihreä
testi, joka lukee samaa toteutusta jota se testaa, ei ole todiste.
